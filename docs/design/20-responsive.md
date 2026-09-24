# Responsive Design

Breakpoints (Tailwind defaults): `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.

**Storefront — mobile-first.** Layouts are authored at mobile width first, then enhanced upward: product grid
is 2 columns by default, 3 at `md`, 4 at `lg`; navigation collapses to icon-only search + cart on mobile with
full nav appearing at `md`. This matters more here than anywhere else in the product because most storefront
traffic arrives from Instagram/WhatsApp links opened on a phone.

**Dashboard — desktop-first, responsive.** The primary persona manages their store from a laptop, but every
page still degrades usably on a tablet (sidebar collapses to icons — planned; tables scroll horizontally
rather than breaking). Full one-handed mobile dashboard use is explicitly out of scope for v1.

Redesigning rather than shrinking: the storefront product grid, cart drawer vs. full cart page, and checkout
form field grouping (e.g. city/state/PIN collapse to a single column on mobile) are each purpose-built for
their breakpoint rather than a single layout scaled down.
