# UI preview (no login, no secrets)

Both dashboards can be viewed and edited on made-up data, with no Supabase keys, database or login.
These routes exist only under `pnpm dev` and return 404 in any other mode.

| Panel | Run | Open |
|---|---|---|
| Store owner's dashboard (`apps/web`) | `pnpm dev:web` | http://localhost:3000/dev-preview |
| Sellly staff console (`apps/admin`) | `pnpm dev:admin` | http://localhost:3002/demo |

## Where to edit the store owner's dashboard

The screens are plain presentation components shared by the real pages and the preview, so one edit
shows up in both:

- `apps/web/app/[store]/overview/overview-view.tsx`
- `apps/web/app/[store]/orders/orders-view.tsx`
- `apps/web/app/[store]/products/products-view.tsx`
- `apps/web/app/[store]/_components/dashboard-shell.tsx` (sidebar and top bar)
- `packages/ui/src/components` (buttons, tables, badges; also used by the other apps)

Sample data lives in `apps/web/app/dev-preview/fixtures.ts`.

Do not edit the `page.tsx` files next to the views, `apps/web/lib`, `apps/web/app/api`, or anything
under `packages/database` or `packages/auth`: they load real data and check permissions.

Screens not yet in the preview (Collections, Customers, Discounts, Analytics, settings...) show a
"Not in the UI preview yet" page.
