import { CharityService } from "@/modules/charities/service";
import { CharityDirectory } from "@/components/charities/CharityDirectory";
import { Heart } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Charity Partners & Directory | Digital Heroes",
  description:
    "Explore our verified charitable partners. At least 10% of every Digital Heroes subscription directly powers their grassroots initiatives.",
};

export default async function CharitiesPage() {
  const charities = await CharityService.getCharities();

  return (
    <div className="min-h-screen bg-brand-navy-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-500/30 bg-brand-emerald-900/30 px-4 py-1 text-xs font-semibold text-brand-emerald-400">
            <Heart className="h-3.5 w-3.5" />
            <span>Guaranteed 10%+ Impact</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Our Charitable Partners
          </h1>
          <p className="text-slate-300 text-base">
            Every golf round you track and every monthly subscription you hold directly supports transparent, verified grassroots causes across India.
          </p>
        </div>

        <CharityDirectory initialCharities={charities} />
      </div>
    </div>
  );
}
