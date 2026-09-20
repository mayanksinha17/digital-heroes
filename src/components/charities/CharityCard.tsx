import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, Sparkles } from "lucide-react";
import type { Charity } from "@/modules/charities/service";

export function CharityCard({ charity }: { charity: Charity }) {
  return (
    <div className="glass-card glass-card-hover flex flex-col justify-between rounded-2xl p-6 relative overflow-hidden group">
      {charity.is_featured && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-semibold text-brand-copper-300 bg-brand-copper-500/20 border border-brand-copper-500/30 px-2.5 py-0.5 rounded-full">
          <Sparkles className="h-3 w-3" />
          <span>Spotlight</span>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-emerald-950/60 border border-brand-emerald-500/30 text-brand-emerald-400 font-bold text-lg">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-brand-emerald-300 transition-colors line-clamp-1">
              {charity.name}
            </h3>
            {charity.category && (
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {charity.category}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-300 line-clamp-3 mb-6">
          {charity.short_description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <span className="text-xs text-brand-emerald-400 font-medium flex items-center gap-1">
          <span>10%+ Eligible</span>
        </span>

        <Link
          href={`/charities/${charity.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-brand-emerald-400 transition"
        >
          <span>View Mission</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
