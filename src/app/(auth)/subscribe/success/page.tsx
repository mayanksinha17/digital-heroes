import { requireUser } from "@/modules/auth/guards";
import { SubscriptionService } from "@/modules/subscriptions/service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Heart, Trophy } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription Confirmed | Digital Heroes",
};

export default async function SubscribeSuccessPage() {
  const viewer = await requireUser();
  const state = await SubscriptionService.requireSubscriptionState(viewer.user.id);

  return (
    <div className="min-h-screen bg-brand-navy-900 flex items-center justify-center p-6">
      <Card className="glass-card max-w-md w-full text-center p-6 space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-emerald-500/20 text-brand-emerald-400 border border-brand-emerald-500/40 shadow-xl shadow-brand-emerald-900/40">
            <CheckCircle className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Payment Received!</h1>
          <p className="text-sm text-slate-300">
            Welcome to Digital Heroes, {viewer.profile.full_name}. Your subscription is active and your rounds are ready to be recorded.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-brand-navy-900/70 p-4 text-xs text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Subscription Status:</span>
            <span className="font-bold text-brand-emerald-400">{state.headline}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Charity Allocation:</span>
            <span className="font-bold text-white">{viewer.profile.charity_percent}% guaranteed</span>
          </div>
        </div>

        <div className="pt-2">
          <Link href="/dashboard" className="w-full">
            <Button size="lg" className="w-full gap-2">
              <span>Go to Your Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
