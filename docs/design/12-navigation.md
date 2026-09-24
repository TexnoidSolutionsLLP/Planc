# Navigation

**Dashboard shell** (`apps/web/app/[store]/_components/dashboard-shell.tsx`): a fixed 248px sidebar with a store
switcher, grouped Lucide outline icons (18px, 1.85 stroke) and 36px items. Active: `secondary` background, primary
text, blue icon. Below `lg` the sidebar becomes a slide-in drawer.

Top bar: menu button (mobile), product search (submits to the Products page), "View store", notifications menu
(recent orders, with a dot for orders needing attention), theme toggle, and the account menu (settings, billing,
sign out).

Groups: Overview, Orders, Products, Collections, Customers, Discounts, Analytics · Storefront (Online Store,
Domain) · Account (Billing, Settings). The order is fixed for every store so navigation becomes muscle memory.
