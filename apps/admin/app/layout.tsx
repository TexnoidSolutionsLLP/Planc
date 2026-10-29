import type { Metadata } from "next";
import { themeInitScript } from "@sellly/ui";
import "@sellly/ui/styles/globals.css";

export const metadata: Metadata = { title: "Sellly — Platform Admin", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
