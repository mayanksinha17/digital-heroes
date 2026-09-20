import { CharityService } from "@/modules/charities/service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Independent Charity Donation | Digital Heroes",
  description: "Make an independent one-off donation directly to verified charities.",
};

export default async function IndependentDonationPage() {
  const charities = await CharityService.getCharities();

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-copper-500/30 bg-brand-copper-900/30 px-4 py-1 text-xs font-semibold text-brand-copper-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Independent Giving · Not Tied to Draws</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Direct Charity Donations</h1>
        <p className="text-sm text-slate-300">
          Want to support a cause beyond your monthly subscription? 100% of your independent donation goes directly to your selected charity partner.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-brand-emerald-400" />
            <span>Make a One-Off Donation</span>
          </CardTitle>
          <CardDescription>
            Choose a verified charity and enter your contribution amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Beneficiary</Label>
            <select
              className="flex h-11 w-full rounded-xl border border-white/10 bg-brand-navy-900/90 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-500"
              defaultValue={charities[0]?.id || ""}
            >
              {charities.map((c) => (
                <option key={c.id} value={c.id} className="bg-brand-navy-900 text-white">
                  {c.name} ({c.category || "General"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <Label>Donation Amount (INR)</Label>
            <div className="grid grid-cols-3 gap-3">
              {[500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className="rounded-xl border border-white/10 bg-brand-navy-900/60 p-3 text-center text-sm font-bold text-white hover:border-brand-emerald-500/50 hover:bg-brand-navy-800 transition"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Or enter custom amount in ₹"
              min="100"
              className="mt-2"
            />
          </div>

          <Button className="w-full" size="lg">
            Proceed to Secure Donation Checkout
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
            <ShieldCheck className="h-4 w-4 text-brand-emerald-400" />
            <span>Processed securely via Stripe PCI-DSS Compliant Gateway</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
