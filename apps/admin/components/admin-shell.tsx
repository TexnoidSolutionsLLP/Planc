"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ThemeToggle } from "@sellly/ui";
import {
  Activity,
  Building2,
  ChevronsLeft,
  KeyRound,
  LayoutDashboard,
  Ellipsis,
  Menu,
  Package,
  Search,
  ScrollText,
  ShieldCheck,
  Store,
  TrendingUp,
  X,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", Icon: LayoutDashboard },
  { href: "/stores", label: "Stores", Icon: Store },
  { href: "/merchants", label: "Merchants", Icon: Building2 },
  { href: "/orders", label: "Orders", Icon: Package },
  { href: "/revenue", label: "Revenue", Icon: TrendingUp },
  { href: "/access", label: "My access", Icon: KeyRound },
  { href: "/audit", label: "Audit history", Icon: ScrollText },
  { href: "/health", label: "System health", Icon: Activity },
];

/** Four most-used destinations; everything else sits behind "More". */
const BOTTOM_NAV = ["/", "/stores", "/orders", "/revenue"];

const MIN_WIDTH = 208;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 248;
const clampWidth = (value: number) =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)));

const isSelected = (current: string, href: string) =>
  current === href || (href !== "/" && current.startsWith(`${href}/`));

/** Presentation only: real admin routes continue to authorize on the server. */
export function AdminShell({
  children,
  email,
  activeGrants,
  footerAction,
  demo = false,
  selectedPath,
}: {
  children: ReactNode;
  email: string;
  activeGrants: number;
  footerAction: ReactNode;
  demo?: boolean;
  selectedPath?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("admin-sidebar-width"));
      if (saved) setWidth(clampWidth(saved));
    } catch {}
  }, []);
  const saveWidth = (value: number) => {
    try {
      localStorage.setItem("admin-sidebar-width", String(value));
    } catch {}
  };
  const mobileToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => {
      if (sidebar.current)
        sidebar.current.inert = window.innerWidth <= 760 && !mobileOpen;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
    controls()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        mobileToggle.current?.focus();
      }
      if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const onResize = () => {
      if (window.innerWidth > 760) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);
  const target = (href: string) =>
    demo ? `/demo${href === "/" ? "" : href}` : href;
  const current = selectedPath ?? pathname;
  const initials = demo ? "DA" : email.slice(0, 2).toUpperCase();
  return (
    <div
      className={`admin-layout${collapsed ? " sidebar-collapsed" : ""}${resizing ? " sidebar-resizing" : ""}`}
      style={{ "--admin-sidebar-user": `${width}px` } as React.CSSProperties}
    >
      <aside
        ref={sidebar}
        id="admin-sidebar"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label="Platform navigation"
        className={`admin-sidebar${mobileOpen ? " mobile-open" : ""}`}
      >
        <div className="admin-brand-row">
          <Link
            href={target("/")}
            className="admin-brand"
            aria-label="Sellly admin home"
          >
            <span className="admin-brand-mark" aria-hidden="true">
              s<span />
            </span>
            <span className="sidebar-label">
              Sellly<span className="brand-admin">Admin</span>
            </span>
          </Link>
          <button
            className="sidebar-collapse"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <ChevronsLeft size={17} aria-hidden="true" />
          </button>
          <button
            className="sidebar-mobile-close"
            onClick={() => {
              setMobileOpen(false);
              mobileToggle.current?.focus();
            }}
            aria-label="Close navigation"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className="admin-navigation" aria-label="Platform">
          {NAV.map(({ href, label, Icon }, index) => {
            const selected = isSelected(current, href);
            return (
              <Link
                key={href}
                href={target(href)}
                onClick={() => setMobileOpen(false)}
                aria-current={selected ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`admin-nav-link${selected ? " selected" : ""}${index === 5 ? " nav-group-start" : ""}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="sidebar-label">{label}</span>
                {href === "/access" && activeGrants > 0 && (
                  <span
                    className="nav-count sidebar-label"
                    aria-label={`${activeGrants} active`}
                  >
                    {activeGrants}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-account">
            <span className="sidebar-avatar">{initials}</span>
            <div className="sidebar-label">
              <span title={email}>{email}</span>
              {footerAction}
            </div>
          </div>
        </div>
        {!collapsed && (
          <div
            className="sidebar-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={width}
            tabIndex={0}
            title="Drag to resize, double-click to reset"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setResizing(true);
            }}
            onPointerMove={(event) => {
              if (!resizing) return;
              const left = sidebar.current?.getBoundingClientRect().left ?? 0;
              setWidth(clampWidth(event.clientX - left));
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              setResizing(false);
              saveWidth(width);
            }}
            onPointerCancel={() => setResizing(false)}
            onDoubleClick={() => {
              setWidth(DEFAULT_WIDTH);
              saveWidth(DEFAULT_WIDTH);
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 32 : 8;
              let next: number | null = null;
              if (event.key === "ArrowLeft") next = width - step;
              if (event.key === "ArrowRight") next = width + step;
              if (event.key === "Home") next = MIN_WIDTH;
              if (event.key === "End") next = MAX_WIDTH;
              if (event.key === "Enter") next = DEFAULT_WIDTH;
              if (next === null) return;
              event.preventDefault();
              const value = clampWidth(next);
              setWidth(value);
              saveWidth(value);
            }}
          />
        )}
      </aside>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => {
            setMobileOpen(false);
            mobileToggle.current?.focus();
          }}
        />
      )}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            ref={mobileToggle}
            className="mobile-navigation-button"
            aria-label="Open navigation"
            aria-controls="admin-sidebar"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <form
            className="admin-global-search"
            action={target("/stores")}
            method="get"
            role="search"
          >
            <Search size={17} aria-hidden="true" />
            <input
              name="q"
              placeholder="Search stores"
              type="search"
              autoComplete="off"
              aria-label="Search stores"
            />
            <span aria-hidden="true">↵</span>
          </form>
          <div className="topbar-actions">
            <ThemeToggle />
            <span className="topbar-divider" />
            <Link
              href={target("/access")}
              className="topbar-profile"
              aria-label="View your platform access"
            >
              <span className="profile-avatar">{initials}</span>
              <span>
                <strong>{demo ? "Demo admin" : email.split("@")[0]}</strong>
              </span>
            </Link>
          </div>
        </header>
        <main id="admin-main-content" tabIndex={-1} className="admin-main">
          {demo && (
            <div className="admin-demo-notice" role="note">
              <span>
                <ShieldCheck size={14} aria-hidden="true" />
                <strong>Sample data</strong>
                <span>Changes are disabled</span>
              </span>
              <Link href="/login">Staff sign-in</Link>
            </div>
          )}
          {children}
        </main>
      </div>
      <nav className="admin-bottom-nav" aria-label="Main">
        {NAV.filter(({ href }) => BOTTOM_NAV.includes(href)).map(
          ({ href, label, Icon }) => {
            const selected = isSelected(current, href);
            return (
              <Link
                key={href}
                href={target(href)}
                aria-current={selected ? "page" : undefined}
                className={selected ? "selected" : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          },
        )}
        <button
          type="button"
          aria-controls="admin-sidebar"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Ellipsis size={20} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
