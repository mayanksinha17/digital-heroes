import { requireUser } from "@/modules/auth/guards";
import { CharityService } from "@/modules/charities/service";
import { CharityPicker } from "@/components/dashboard/CharityPicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Charity Selection & Impact | Digital Heroes",
  description: "View and adjust your designated charitable partner and monthly contribution percentage.",
};

export default async function DashboardCharityPage() {
  const viewer = await requireUser();
  const charities = await CharityService.getCharities();
  const currentCharity = viewer.profile.charity_id
    ? await CharityService.getCharityById(viewer.profile.charity_id)
    : null;

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Current Impact Overview */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-emerald-950/80 border border-brand-emerald-500/40 text-brand-emerald-400">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Your Charitable Impact</h1>
            <p className="text-xs text-slate-400">
              PRD §08 · Minimum 10% guaranteed contribution with voluntary increase
            </p>
          </div>
        </div>

        {currentCharity ? (
          <div className="rounded-2xl border border-white/10 bg-brand-navy-900/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-emerald-400">
                Currently Supporting
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{currentCharity.name}</h3>
              <p className="text-xs text-slate-300 line-clamp-1">{currentCharity.short_description}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Active Contribution
              </span>
              <div className="text-xl font-bold text-brand-emerald-400">
                {viewer.profile.charity_percent}% of fee
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
            You have not yet selected a primary charity. Choose one below to allocate your 10%+ subscription contribution.
          </div>
        )}
      </div>

      {/* Update Charity Preference Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Change Charity or Contribution Rate</CardTitle>
          <CardDescription>
            Changes will apply prospectively to your next subscription billing cycle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CharityPicker
            charities={charities}
            currentCharityId={viewer.profile.charity_id}
            currentCharityPercent={viewer.profile.charity_percent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
