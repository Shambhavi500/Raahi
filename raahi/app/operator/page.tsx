import type { Metadata } from "next";
import OperatorApp from "@/components/operator/OperatorApp";

export const metadata: Metadata = { title: "Raahi: operator console" };

export default function Page() {
  return <OperatorApp />;
}
