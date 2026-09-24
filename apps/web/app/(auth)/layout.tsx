import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(37,99,235,0.07),transparent_70%)]" aria-hidden="true" />
      <div className="relative w-full max-w-[400px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5" aria-label="Sellly home">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand text-[14px] font-bold text-white">S</span>
          <span className="text-[19px] font-semibold tracking-tight text-primary">Sellly</span>
        </Link>
        <div className="rounded-lg border border-border bg-surface p-7 shadow-sm sm:p-8">{children}</div>
        <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-small text-muted transition-colors hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
      </div>
    </div>
  );
}
