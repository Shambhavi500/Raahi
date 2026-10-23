"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_CENTER, curvePoint } from "@/lib/shared";

type Point = { lat: number; lng: number };
export type MapMarker = Point & { kind: "pickup" | "drop" | "driver" | "dot"; title?: string };

const CAR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#151618" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>';

// Gentle curve between two points so the route reads like a journey, not a ruler line.
function curve(a: Point, b: Point, steps = 32): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = curvePoint(a, b, i / steps);
    return [p.lat, p.lng] as [number, number];
  });
}

export default function RaahiMap({
  route,
  markers = [],
  pinMode = false,
  onCenterChange,
  focus,
  className = "",
}: {
  route?: { from: Point; to: Point } | null;
  markers?: MapMarker[];
  pinMode?: boolean;
  onCenterChange?: (p: Point) => void;
  /** Change this to re-fit the map to its markers. */
  focus?: string;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const onCenterRef = useRef(onCenterChange);
  const pinModeRef = useRef(pinMode);
  const fitRef = useRef<() => void>(() => undefined);
  const needsFitRef = useRef(false);
  const [ready, setReady] = useState(false);
  onCenterRef.current = onCenterChange;
  pinModeRef.current = pinMode;

  // Fit the view to the route and markers (kept in a ref so the resize observer can call it).
  fitRef.current = () => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || pinMode) return;
    // Fitting a hidden (zero-size) map picks a wrong zoom, so wait until it's visible.
    if (!el.current?.clientWidth) {
      needsFitRef.current = true;
      return;
    }
    needsFitRef.current = false;
    const pts: Point[] = [...markers];
    if (route) pts.push(route.from, route.to);
    if (pts.length === 1) map.setView([pts[0].lat, pts[0].lng], 14, { animate: true });
    else if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), {
        padding: [48, 48],
        maxZoom: 15,
        animate: true,
      });
    }
  };

  // Create the map once (Leaflet needs the browser, so it's loaded on the client only).
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      LRef.current = L;
      const map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(
        [CITY_CENTER.lat, CITY_CENTER.lng],
        12,
      );
      // OpenStreetMap tiles: free and keyless. Toned down in CSS (.raahi-tiles) so our markers stand out.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: "raahi-tiles",
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      map.attributionControl.setPrefix(false);
      layerRef.current = L.layerGroup().addTo(map);
      map.on("moveend", () => {
        if (pinModeRef.current) onCenterRef.current?.(map.getCenter());
      });
      // A map shown after being hidden (e.g. behind a tab) does its pending fit now.
      observer = new ResizeObserver(() => {
        map.invalidateSize();
        if (needsFitRef.current && el.current?.clientWidth) fitRef.current();
      });
      observer.observe(el.current);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw markers and the route whenever they change.
  useEffect(() => {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    if (route) {
      const pts = curve(route.from, route.to);
      L.polyline(pts, { color: "#151618", weight: 5, opacity: 0.85, lineCap: "round" }).addTo(layer);
      L.polyline(pts, { color: "#d4f639", weight: 2, opacity: 1, dashArray: "1 9", lineCap: "round" }).addTo(layer);
    }
    for (const m of markers) {
      const html =
        m.kind === "driver"
          ? `<div class="raahi-pin-driver">${CAR_SVG}</div>`
          : `<div class="raahi-pin-${m.kind}"></div>`;
      const size = m.kind === "driver" ? 34 : m.kind === "dot" ? 12 : 22;
      L.marker([m.lat, m.lng], {
        icon: L.divIcon({ html, className: "raahi-pin", iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        title: m.title,
        zIndexOffset: m.kind === "driver" ? 1000 : 0,
        interactive: false,
      }).addTo(layer);
    }
  }, [ready, route, markers]);

  // Refit only on purpose (focus changes), not on every poll.
  useEffect(() => {
    if (ready) fitRef.current();
  }, [ready, focus, pinMode]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={el} className="absolute inset-0" />
      {pinMode && (
        <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center">
          <div className="-mt-9 flex flex-col items-center">
            <div className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white shadow-lg">Move the map</div>
            <div className="h-5 w-0.5 bg-ink" />
            <div className="size-3 rounded-full border-2 border-ink bg-brand" />
          </div>
        </div>
      )}
    </div>
  );
}
