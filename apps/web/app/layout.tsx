import type { Metadata } from "next";
import { ToastProvider, themeInitScript } from "@sellly/ui";
import "@sellly/ui/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Sellly — Turn conversations into revenue", template: "%s · Sellly" },
  description: "Launch a store from your Instagram or WhatsApp audience, accept payments and manage every order in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
