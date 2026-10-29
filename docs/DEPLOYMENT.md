# Deploying Sellly (Supabase + Vercel)

This guide takes you from an empty Supabase account to the three Sellly apps
running on Vercel. Follow the steps in order. Every variable mentioned is
explained in [`.env.example`](../.env.example).

## What gets deployed

One Git repository, three separate websites (three Vercel projects):

| App | Folder | Who uses it |
|---|---|---|
| Merchant dashboard | `apps/web` | Merchants managing their stores |
| Storefront | `apps/storefront` | Shoppers |
| Platform admin | `apps/admin` | Sellly's own team only |

All three share one Supabase project (database, logins and image storage).
Nothing needs separate hosting: there are no background workers or
long-running servers. Notifications are sent while the request runs.

## 1. Create the Supabase project

1. Go to supabase.com → **New project**. Choose a region near your customers
   (e.g. Mumbai). Save the database password somewhere safe.
2. **Project Settings → API**: copy the *Project URL*, the *anon* key and the
   *service_role* key. These are `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY`.
3. **Connect → ORMs → Prisma**: copy the two connection strings.
   - Transaction pooler (port **6543**) → `DATABASE_URL`, and add
     `?pgbouncer=true&connection_limit=1` to the end.
   - Direct / session (port **5432**) → `DIRECT_URL`.
4. **Authentication → Sign In / Providers → Email**: keep *Confirm email*
   **on**. Merchants must prove they own their email before they can sign in.
5. **Authentication → URL Configuration**:
   - *Site URL*: your merchant dashboard URL, e.g. `https://sellly-web.vercel.app`.
   - *Redirect URLs*: add `https://YOUR-WEB-URL/auth/callback` (and
     `http://localhost:3000/auth/callback` for local development). Sign-up
     confirmation and password-reset links only work for URLs on this list.
6. Recommended: **Project Settings → Data API**, remove `public` from
   *Exposed schemas*. The apps never use Supabase's REST API, and the
   migration already locks it down, so this is a second layer of protection.
7. Recommended for production: **Authentication → Emails → SMTP Settings**,
   add your own email provider. Supabase's built-in sender is rate-limited
   and meant for testing.

## 2. Set up the database, storage and first staff account

Run these from your own computer, in the repo folder, with a `.env` file
filled in from `.env.example` (copy it to `packages/database/.env` too):

```bash
pnpm install
pnpm db:deploy        # creates all tables and the access-control rules
pnpm storage:setup    # creates the public "store-media" image bucket
pnpm staff:create --email you@yourcompany.com --name "Your Name"
```

`staff:create` prints a temporary password once. Share it securely. It is the
**only** way to create a Sellly staff account: signing up on the website always
creates a merchant account. Use a different email from any merchant account.
To remove someone's staff access: `pnpm staff:create --email them@... --remove`.

**Do not run `pnpm db:seed` against production.** It creates a demo account
with a known password, and it refuses to run when `NODE_ENV=production`.

### Moving existing users (only if you have real accounts from the old login)

Old passwords can't be carried over to Supabase. Run:

```bash
pnpm --filter @sellly/auth users:migrate --dry-run
pnpm --filter @sellly/auth users:migrate --send-reset "https://YOUR-WEB-URL/auth/callback?next=/reset-password"
```

Each merchant gets an email to choose a new password. Without `--send-reset`,
they use **Forgot password?** on the login page.

## 3. Create the three Vercel projects

Repeat for each app. In Vercel: **Add New → Project → import this repository**.

| Setting | Merchant dashboard | Storefront | Platform admin |
|---|---|---|---|
| Root Directory | `apps/web` | `apps/storefront` | `apps/admin` |
| Framework | Next.js | Next.js | Next.js |
| Build / Install commands | leave default | leave default | leave default |
| Node.js version (Settings → General) | 20.x or newer | same | same |

Vercel detects pnpm from the lockfile and installs the whole workspace, and
the Prisma client is generated automatically during install. Keep
*"Include source files outside of the Root Directory"* enabled (the default),
because the apps import the shared `packages/` folder.

### Environment variables per project

Set these in each project under **Settings → Environment Variables** for the
*Production* environment (and *Preview* if you use preview deployments, ideally
pointing at a separate Supabase project).

| Variable | web | storefront | admin |
|---|:-:|:-:|:-:|
| `DATABASE_URL`, `DIRECT_URL` | ✓ | ✓ | ✓ |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | ✓ | | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | | ✓ |
| `SUPABASE_STORAGE_BUCKET` (optional) | ✓ | | ✓ |
| `APP_URL` | ✓ | | |
| `STOREFRONT_URL` | ✓ | | ✓ |
| `STOREFRONT_ROOT_DOMAINS` | | ✓ | |
| `ENCRYPTION_KEY` (same value in both) | ✓ | ✓ | |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (optional) | ✓ | | |
| `RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL` (optional) | ✓ | ✓ | |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (optional) | ✓ | ✓ | |

Deploy the **storefront first** to learn its URL, then set `STOREFRONT_URL` in
the other two and deploy them. After the web app is live, put its URL in
`APP_URL` and in Supabase's Site URL / Redirect URLs (step 1.5), then redeploy web.

### Protect the admin app

The admin app is for Sellly staff only. On its Vercel project, turn on
**Settings → Deployment Protection** (Vercel Authentication or password
protection) as an extra lock in front of the staff login.

## 4. Domains

- On `*.vercel.app` everything works, but stores are reached by path:
  `https://YOUR-STOREFRONT.vercel.app/store-slug`.
- For store subdomains (`store-slug.yourdomain.com`): add `yourdomain.com` and
  `*.yourdomain.com` to the storefront project (**Settings → Domains**; wildcard
  domains require Vercel's nameservers), then set
  `STOREFRONT_ROOT_DOMAINS=yourdomain.com` and redeploy.
- Merchants' own custom domains (e.g. `shop.theirbrand.com`) are **not yet
  routed** by the storefront: its middleware only understands subdomains of the
  root domain. This needs a code change before custom domains can go live.

## 5. Every later release

1. If the release includes a new folder in `packages/database/prisma/migrations`,
   run `pnpm db:deploy` against production **before** the apps go live.
   Don't run migrations inside Vercel builds: preview builds would change the
   production database.
2. Push to the main branch. Vercel deploys all three projects.

## 6. How staff access works (for support and the team)

- Being Sellly staff only opens platform-level pages: the store and merchant
  directory, counts, plans, subscription revenue, combined sales across all
  stores, audit history of staff activity, and system health.
- A store's private information needs the **store owner's approval**, given
  one area at a time (store details, orders, customers, products, plan, owner
  account), with *view* and *change* approved separately. This covers addresses,
  contacts, that store's sales, orders, customers and products.
- Staff request access on the store's page in the admin app. The owner sees
  the request in their dashboard under **Sellly access**, approves or rejects
  it, and can revoke it at any time. Every approval expires automatically (1
  hour to 7 days, as requested).
- Staff can never approve their own requests: only a merchant who owns the
  store can, and the database itself rejects anything else.
- Every request, decision, view of protected data and change made by staff is
  recorded, and the owner can see it on their **Sellly access** page.
- Suspending a store, changing its plan or suspending the owner's account also
  needs the owner's approval. If Sellly needs to act without the owner (fraud,
  legal), that "emergency override" doesn't exist yet and would need a
  separate, deliberate decision.

## 7. Known limits

- **Rate limiting is per server instance** (in memory). On Vercel each
  instance has its own counter, so the login/sign-up limits are weaker than
  they look. Move them to a shared store (e.g. Upstash Redis) before heavy traffic.
- **Billing isn't automated.** Plans are changed by staff (with owner approval);
  "MRR" is the list price of active paid plans, not collected money.
- **Abandoned checkouts** aren't tracked with contact details, so there is no
  recovery page. Checkout only records that a checkout started.
