export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-emerald-500/20 border-t-brand-emerald-400" />
        <p className="text-xs uppercase tracking-wider text-slate-400">Loading Digital Heroes...</p>
      </div>
    </div>
  );
}
