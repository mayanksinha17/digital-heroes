import Link from "next/link";
import { Heart, Trophy, ShieldCheck, Sparkles } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-brand-navy-950/90 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-emerald-500 to-brand-emerald-700 text-slate-950 font-black shadow-lg">
                DH
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Digital Heroes
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Performance-driven golf rewards platform uniting Stableford tracking, verified charitable giving ($\ge 10\%$), and monthly cash prize draws.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-emerald-400 bg-brand-emerald-950/40 px-2.5 py-1 rounded-full border border-brand-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              <span>Feel, Not Fairway</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/draws" className="hover:text-white transition">
                  Draws & Historical Results
                </Link>
              </li>
              <li>
                <Link href="/charities" className="hover:text-white transition">
                  Partner Charities Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Trust & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Trust & Integrity</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/trust" className="hover:text-white transition">
                  Verifiable Draw Engine
                </Link>
              </li>
              <li>
                <Link href="/trust" className="hover:text-white transition">
                  10%+ Charity Floor Guarantee
                </Link>
              </li>
              <li>
                <Link href="/trust" className="hover:text-white transition">
                  Scorecard Proof Verification
                </Link>
              </li>
              <li>
                <Link href="/trust" className="hover:text-white transition">
                  PCI-DSS Stripe Billing
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Account & Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Subscriber Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition">
                  Create Subscriber Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Subscriber Hub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Digital Heroes. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-400" />
              Verified Performance & Giving Protocol
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
