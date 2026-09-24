import Link from "next/link";
import { buttonVariants } from "@sellly/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-caption text-brand">404</p>
      <h1 className="mt-2 text-h2 text-primary">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-body text-muted">The link may be broken, or the store you&apos;re looking for isn&apos;t available to your account.</p>
      <Link href="/" className={`${buttonVariants({})} mt-6`}>
        Back to home
      </Link>
    </main>
  );
}
