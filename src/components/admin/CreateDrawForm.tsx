"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateDrawAction } from "@/modules/draws/actions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, ArrowRight, AlertCircle, RefreshCw, Sparkles } from "lucide-react";

interface CreateDrawFormProps {
  incomingRolloverCents: number;
}

export function CreateDrawForm({ incomingRolloverCents }: CreateDrawFormProps) {
  const router = useRouter();
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [drawMonth, setDrawMonth] = useState(defaultMonth);
  const [mode, setMode] = useState<"random" | "algorithmic">("random");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await adminCreateDrawAction(drawMonth, mode);
    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.error || "Failed to create draw");
      return;
    }

    router.push(`/admin/draws/${res.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rollover In Summary */}
      <div className="p-4 rounded-2xl bg-brand-navy-900/80 border border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Incoming Jackpot Rollover
          </span>
          <p className="text-xs text-slate-300">
            Automatically loaded from previous published draw
          </p>
        </div>
        <div className="text-xl font-black text-brand-copper-300">
          {formatMoney(incomingRolloverCents)}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="drawMonth">Draw Calendar Month (YYYY-MM-01)</Label>
        <Input
          id="drawMonth"
          type="date"
          value={drawMonth}
          onChange={(e) => setDrawMonth(e.target.value)}
          required
          className="bg-brand-navy-900 border-white/10"
        />
        <p className="text-[11px] text-slate-400">
          Must be the 1st of the calendar month (e.g. 2026-09-01).
        </p>
      </div>

      <div className="space-y-2">
        <Label>Draw Engine Mode</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("random")}
            className={`p-4 rounded-xl border text-left transition ${
              mode === "random"
                ? "bg-amber-500/15 border-amber-500/50 text-white"
                : "bg-brand-navy-900/40 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <div className="font-bold text-sm text-white">Random Draw</div>
            <div className="text-xs text-slate-400 mt-1">
              Uniform CSPRNG pseudo-random sampling across [1, 45].
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("algorithmic")}
            className={`p-4 rounded-xl border text-left transition ${
              mode === "algorithmic"
                ? "bg-amber-500/15 border-amber-500/50 text-white"
                : "bg-brand-navy-900/40 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <div className="font-bold text-sm text-white">Algorithmic Draw</div>
            <div className="text-xs text-slate-400 mt-1">
              Frequency-weighted distribution based on entrant scores.
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Creating Draft...</span>
          </>
        ) : (
          <>
            <span>Initialize Draft Draw</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}
