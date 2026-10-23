import type { Metadata } from "next";
import PassengerApp from "@/components/passenger/PassengerApp";

export const metadata: Metadata = { title: "Raahi: ride" };

export default function Page() {
  return <PassengerApp />;
}
