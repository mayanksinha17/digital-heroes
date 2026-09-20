import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Heart,
  Trophy,
  CheckCircle2,
  FileText,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trust, Security & Transparency | Digital Heroes",
  description:
    "Learn about our cryptographic draw verification, guaranteed 10%+ charity allocations, scorecard review process, and data protection standards.",
};

export default function TrustPage() {
  const trustPillars = [
    {
      icon: Heart,
      title: "Guaranteed 10%+ Charity Floor",
      description:
        "Every subscription invoice automatically commits at least 10% directly to verified partner charities. This is enforced by PostgreSQL database constraints and cannot be bypassed.",
    },
    {
      icon: Trophy,
      title: "Verifiable Draw Mathematics",
      description:
        "Draw numbers are generated using cryptographic CSPRNG or transparent frequency-weighted algorithms. Exact 40/35/25 tier splits and integer-floor remainder accounting ensure zero lost or created funds.",
    },
    {
      icon: ShieldCheck,
      title: "Scorecard Proof Verification",
      description:
        "Before any cash prize is disbursed, winners must submit verified scorecard screenshots matching their 5 Stableford numbers. Every verification decision is permanently recorded in audit logs.",
    },
    {
      icon: Lock,
      title: "Private Storage & Data Isolation",
      description:
        "Winner proof files and scorecards are stored in private Supabase Storage buckets with short-lived signed URLs. Proofs are never publicly accessible, preventing enumeration or unauthorized viewing.",
    },
    {
      icon: CreditCard,
      title: "PCI-DSS Compliant Stripe Gateway",
      description:
        "Payment details and credit card credentials are processed directly through Stripe's certified PCI-DSS Level 1 infrastructure. Digital Heroes never stores raw card numbers or CVVs.",
    },
    {
      icon: FileText,
      title: "Immutable System Audit Trails",
      description:
        "All administrative actions, draw publishing events, score mutations, and payout state changes are immutably logged with actor IDs, timestamps, and before/after state snapshots.",
    },
  ];

  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-500/30 bg-brand-emerald-950/40 px-4 py-1.5 text-xs font-semibold text-brand-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Platform Integrity Standards</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Trust, Security & Transparency
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          How Digital Heroes protects your data, verifies golf performance, and ensures transparent charitable and financial operations.
        </p>
      </div>

      {/* 6 Trust Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trustPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-3xl p-6 sm:p-8 space-y-3 border border-white/10 hover:border-white/20 transition"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy-900 border border-white/10 text-brand-emerald-400 shadow-inner">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 pt-6">
        <Button
          asChild
          size="lg"
          className="bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold px-8 h-12 gap-2"
        >
          <Link href="/signup">
            <span>Join with Confidence</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
