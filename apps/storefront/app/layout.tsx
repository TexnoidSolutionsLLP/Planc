import type { Metadata } from "next";
import "@sellly/ui/styles/globals.css";

export const metadata: Metadata = {
  title: "Sellly Store",
  description: "Shop the collection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
