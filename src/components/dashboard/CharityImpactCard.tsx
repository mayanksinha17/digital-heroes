import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { Heart, ArrowRight, Sparkles, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Charity } from "@/modules/charities/service";

interface CharityImpactCardProps {
  charity: Charity | null;
  charityPercent: number;
  charityImpactCents: number;
}

export function CharityImpactCard({
  charity,
  charityPercent,
  charityImpactCents,
}: CharityImpactCardProps) {
  const formattedImpact = formatMoney(charityImpactCents);

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Heart className="h-4 w-4 text-brand-emerald-400" />
            <span>Charitable Impact</span>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold"
          >
            {charityPercent}% of fee
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="text-xl font-bold text-white tracking-tight truncate">
            {charity ? charity.name : "No Charity Selected"}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">
            {charity
              ? charity.short_description
              : "Select a partner charity to allocate your guaranteed 10%+ monthly contribution."}
          </p>
        </div>

        {/* Cumulative Contribution Stat */}
        <div className="p-3.5 rounded-xl bg-brand-navy-900/70 border border-white/5 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Your Cumulative Contribution
          </span>
          <div className="text-xl font-black text-brand-emerald-400">{formattedImpact}</div>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <Button asChild variant="outline" size="sm" className="w-full text-xs h-9 gap-1">
          <Link href="/dashboard/charity">
            <span>Manage Charity</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
