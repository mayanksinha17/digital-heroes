import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-brand-navy-900">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-emerald-500 to-brand-emerald-700 text-white shadow-lg shadow-brand-emerald-900/40">
            <Sparkles className="h-5 w-5" />
          </div>
          <span>Digital Heroes</span>
        </Link>
      </div>

      <div className="w-full max-w-md">{children}</div>

      <div className="mt-8 text-center text-xs text-slate-400">
        <p>A charity-first golf reward and performance tracking platform.</p>
      </div>
    </div>
  );
}
