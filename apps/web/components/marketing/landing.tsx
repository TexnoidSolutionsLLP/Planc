import Link from "next/link";
import { Check, CreditCard, LineChart, MessageCircle, Package, Sparkles, Tag } from "lucide-react";
import { buttonVariants, cn } from "@sellly/ui";
import { DashboardPreview } from "./dashboard-preview";

const FEATURES = [
  { Icon: MessageCircle, title: "A storefront built for your bio link", body: "One link for Instagram and WhatsApp. Mobile-first pages that load fast on any network, so customers go from chat to cart in seconds." },
  { Icon: CreditCard, title: "Checkout you can trust", body: "Cash on delivery out of the box, plus UPI, cards, net banking and wallets through Razorpay. Payments are confirmed by signed webhooks, never by the browser." },
  { Icon: Package, title: "Every order in one place", body: "Move orders from confirmed to delivered with one click. Customers get updates by email and WhatsApp as each step happens." },
  { Icon: Tag, title: "Discounts that just work", body: "Percentage, fixed-amount and free-shipping codes with minimums, usage limits and dates — validated on the server at checkout." },
  { Icon: LineChart, title: "Numbers you can act on", body: "Revenue, orders, top products and a real visit-to-order funnel, compared against the previous period." },
  { Icon: Sparkles, title: "AI that drafts, you approve", body: "Turn a product photo into a listing, or describe your business and get a homepage draft. Nothing goes live until you say so." },
];

const STEPS = [
  { n: "01", title: "Add your products", body: "Upload photos, set prices and inventory. Let AI draft the copy if you like." },
  { n: "02", title: "Share one link", body: "Put your store link in your Instagram bio and WhatsApp status. Pick a theme, add your colors." },
  { n: "03", title: "Get paid and ship", body: "Orders land in your dashboard. Confirm, pack, ship — and keep customers in the loop automatically." },
];

const PLANS = [
  { name: "Free", price: "₹0", blurb: "Start selling today.", features: ["Unlimited products", "Basic storefront", "Basic order management"], cta: "Start for free", featured: false },
  { name: "Pro", price: "₹999", blurb: "Look and run like a brand.", features: ["Custom domain", "Advanced analytics", "Discount codes", "WhatsApp notifications", "Remove Sellly branding"], cta: "Start for free", featured: true },
  { name: "Business", price: "₹2,499", blurb: "For teams shipping daily.", features: ["Everything in Pro", "Staff accounts", "Abandoned cart recovery", "Advanced shipping", "Priority support"], cta: "Start for free", featured: false },
];

const FAQ = [
  { q: "Do I need a website or any technical skills?", a: "No. You add products and pick a theme; Sellly gives you a fast, mobile-ready store with its own link. Most sellers publish in under ten minutes." },
  { q: "How do my customers pay?", a: "Cash on delivery works immediately. Connect your own Razorpay account to accept UPI, cards, net banking and wallets — money settles directly to you." },
  { q: "Can I use my own domain?", a: "Yes, on the Pro plan. Add your domain, create two DNS records, and verify — the setup steps are shown in the dashboard." },
  { q: "How do customers find my store?", a: "You share one link. Put it in your Instagram bio, WhatsApp status and DMs, and customers land directly on your products." },
  { q: "Is there a free plan?", a: "Yes. The Free plan includes unlimited products and everything you need to take your first orders." },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand text-[13px] font-bold text-white">S</span>
      <span className="text-[17px] font-semibold tracking-tight text-primary">Sellly</span>
    </span>
  );
}

export function Landing() {
  return (
    <div className="bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Sellly home">
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 text-[14px] font-medium text-muted md:flex">
            <a href="#features" className="transition-colors hover:text-primary">Product</a>
            <a href="#how-it-works" className="transition-colors hover:text-primary">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-primary">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-primary">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Log in</Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>Start for free</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:pb-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-caption font-semibold uppercase tracking-[0.12em] text-brand">Built for modern commerce</p>
              <h1 className="mt-5 text-display text-primary">Turn conversations into revenue.</h1>
              <p className="mx-auto mt-6 max-w-xl text-body-lg text-muted">
                Create a faster path from customer conversation to checkout. Launch a store from your Instagram or WhatsApp audience, take payments, and manage every order in one place.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup" className={buttonVariants({ size: "lg" })}>Start for free</Link>
                <a href="#how-it-works" className={buttonVariants({ variant: "secondary", size: "lg" })}>See how it works</a>
              </div>
              <p className="mt-4 text-small text-subtle">Free plan · No card required · Live in about ten minutes</p>
            </div>
            <div className="mx-auto mt-14 max-w-5xl sm:mt-20">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-caption font-semibold uppercase tracking-[0.12em] text-brand">Product</p>
            <h2 className="mt-3 text-h2 text-primary">Everything between a message and a delivery.</h2>
            <p className="mt-4 text-body-lg text-muted">One calm workspace for the whole loop — storefront, payments, fulfillment and follow-up.</p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="bg-surface p-7 transition-colors duration-200 hover:bg-background">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-brand">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                </span>
                <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-primary">{title}</h3>
                <p className="mt-2 text-body text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-surface">
          <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-2xl">
              <p className="text-caption font-semibold uppercase tracking-[0.12em] text-brand">How it works</p>
              <h2 className="mt-3 text-h2 text-primary">From first product to first order.</h2>
            </div>
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <p className="tabular text-[13px] font-semibold text-brand">{s.n}</p>
                  <h3 className="mt-3 text-h3 text-primary">{s.title}</h3>
                  <p className="mt-2 text-body text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.12em] text-brand">Pricing</p>
            <h2 className="mt-3 text-h2 text-primary">Simple pricing that grows with you.</h2>
            <p className="mt-4 text-body-lg text-muted">Start free. Upgrade when your store needs more.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={cn("flex flex-col rounded-md border bg-surface p-7", plan.featured ? "border-brand ring-1 ring-brand/20" : "border-border")}>
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold text-primary">{plan.name}</p>
                  {plan.featured && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[12px] font-medium text-brand">Most popular</span>}
                </div>
                <p className="mt-4 text-primary">
                  <span className="tabular text-[40px] font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-small text-muted"> / month</span>
                </p>
                <p className="mt-1 text-small text-muted">{plan.blurb}</p>
                <ul className="mt-6 flex-1 space-y-3 text-small">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-primary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.25} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn(buttonVariants({ variant: plan.featured ? "primary" : "secondary" }), "mt-8")}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-small text-subtle">Prices in INR. Paid plans are activated by our team today — self-serve billing is coming.</p>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-border bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
            <h2 className="text-h2 text-primary">Questions, answered.</h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/25 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="text-[20px] leading-none text-subtle transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-body text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-24">
          <div className="rounded-xl bg-[linear-gradient(135deg,#2563EB,#1E3A8A)] px-6 py-16 text-center sm:px-16">
            <h2 className="text-h2 text-white">Your audience is already there.</h2>
            <p className="mx-auto mt-4 max-w-lg text-body-lg text-white/80">Give them a place to buy. Launch your store today — it takes about ten minutes.</p>
            <Link href="/signup" className="mt-8 inline-flex h-12 items-center rounded bg-white px-6 text-[15px] font-semibold text-[#1E3A8A] transition-colors duration-200 hover:bg-[#EFF6FF] focus-visible:ring-[3px] focus-visible:ring-white/50 focus-visible:outline-none sm:h-11">
              Start for free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2 text-small text-muted">
            <a href="#features" className="hover:text-primary">Product</a>
            <a href="#pricing" className="hover:text-primary">Pricing</a>
            <Link href="/login" className="hover:text-primary">Log in</Link>
            <Link href="/signup" className="hover:text-primary">Sign up</Link>
          </nav>
          <p className="text-small text-subtle">© {new Date().getFullYear()} Sellly</p>
        </div>
      </footer>
    </div>
  );
}
