import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle, themeInitScript } from "@sellly/ui";
import { Building2, Package, Store, TrendingUp } from "lucide-react";
import "@sellly/ui/styles/globals.css";

export const metadata: Metadata = { title: "Sellly — Platform Admin" };

const NAV = [
  { href: "/", label: "Merchants", Icon: Building2 },
  { href: "/stores", label: "Stores", Icon: Store },
  { href: "/orders", label: "Orders", Icon: Package },
  { href: "/revenue", label: "Revenue", Icon: TrendingUp },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="flex min-h-screen flex-col md:flex-row">
          <aside className="shrink-0 border-b border-border bg-surface p-3 md:w-60 md:border-b-0 md:border-r md:p-4">
            <div className="mb-3 flex items-center justify-between md:mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand text-[13px] font-bold text-white">S</span>
                <span className="text-[15px] font-semibold tracking-tight">Admin</span>
              </div>
              <ThemeToggle />
            </div>
            <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Platform">
              {NAV.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex h-10 items-center gap-2.5 whitespace-nowrap rounded px-3 text-[14px] font-medium text-muted transition-colors duration-150 hover:bg-secondary hover:text-primary md:h-9"
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
