import Link from "next/link";
import type { FooterVariant } from "@sellly/theme";

export function StorefrontFooter({
  storeName,
  storeSlug,
  description,
  supportEmail,
  variant,
  shopLabel,
}: {
  storeName: string;
  storeSlug: string;
  description?: string | null;
  supportEmail?: string | null;
  variant: FooterVariant;
  shopLabel: string;
}) {
  const year = new Date().getFullYear();
  const powered = <p className="text-caption text-subtle">Powered by Sellly</p>;

  if (variant === "big") {
    return (
      <footer className="mt-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-12">
          <p className="sf-heading break-words text-[clamp(44px,12vw,140px)] leading-[0.9] text-primary">{storeName}</p>
          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-5 text-small text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {storeName}
              {supportEmail && (
                <>
                  {" · "}
                  <a href={`mailto:${supportEmail}`} className="hover:text-primary">
                    {supportEmail}
                  </a>
                </>
              )}
            </p>
            {powered}
          </div>
        </div>
      </footer>
    );
  }

  if (variant === "columns") {
    return (
      <footer className="mt-20 border-t border-border bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-small text-muted md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="sf-heading text-h3 text-primary">{storeName}</p>
            {description && <p className="mt-3 max-w-sm">{description}</p>}
          </div>
          <div>
            <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-primary">Explore</p>
            <ul className="space-y-2">
              <li><Link href={`/${storeSlug}`} className="hover:text-primary">Home</Link></li>
              <li><Link href={`/${storeSlug}/search`} className="hover:text-primary">{shopLabel}</Link></li>
              <li><Link href={`/${storeSlug}/track`} className="hover:text-primary">Track order</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-primary">Contact</p>
            {supportEmail ? (
              <a href={`mailto:${supportEmail}`} className="hover:text-primary">{supportEmail}</a>
            ) : (
              <p>Reach out via the store.</p>
            )}
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-caption text-subtle sm:flex-row sm:justify-between">
            <p>© {year} {storeName}</p>
            {powered}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-10 text-center text-small text-muted">
        <p className="sf-heading text-[18px] text-primary">{storeName}</p>
        {supportEmail && <p>{supportEmail}</p>}
        <div className="mt-2">{powered}</div>
      </div>
    </footer>
  );
}
