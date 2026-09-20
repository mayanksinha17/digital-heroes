import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="glass-card max-w-md rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-white">404 - Page Not Found</h2>
        <p className="text-sm text-slate-300">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-brand-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-emerald-500"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
