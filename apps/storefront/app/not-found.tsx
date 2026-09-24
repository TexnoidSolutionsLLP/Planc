import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-h1 text-primary">404</h1>
      <p className="text-body text-muted">This page, or store, doesn&apos;t exist.</p>
      <Link href="/" className="text-small text-accent hover:underline">
        Go home
      </Link>
    </div>
  );
}
