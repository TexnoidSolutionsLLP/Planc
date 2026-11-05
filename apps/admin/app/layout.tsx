import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { themeInitScript } from "@sellly/ui";
import "@sellly/ui/styles/globals.css";
import "./admin-theme.css";
import "./admin-skin.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-admin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sellly — Platform Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="admin-app">
        <a className="admin-skip-link" href="#admin-main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
