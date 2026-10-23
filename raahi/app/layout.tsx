import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raahi: your daily commute, handled",
  description: "Recurring commute subscriptions with fleet-backed backup drivers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
