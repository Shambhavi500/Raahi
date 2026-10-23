import type { Metadata } from "next";
import DriverApp from "@/components/driver/DriverApp";

export const metadata: Metadata = { title: "Raahi: drive" };

export default function Page() {
  return <DriverApp />;
}
