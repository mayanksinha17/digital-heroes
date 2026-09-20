"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Trophy,
  Heart,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicNavProps {
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

const publicLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/charities", label: "Charities" },
  { href: "/draws", label: "Draws & Results" },
  { href: "/trust", label: "Trust & Verification" },
];

export function PublicNav({ user }: PublicNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-brand-navy-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-emerald-500 to-brand-emerald-700 text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              DH
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight leading-none">
                Digital Heroes
              </span>
              <span className="text-[10px] text-brand-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
                Golf · Rewards · Charity
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {publicLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-brand-emerald-500/15 text-brand-emerald-400 border border-brand-emerald-500/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                asChild
                size="sm"
                className="bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                  <span>{user.role === "admin" ? "Admin Console" : "Your Dashboard"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Link href="/signup">
                    <span>Join Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-brand-navy-950/95 backdrop-blur-2xl px-4 py-5 space-y-4">
          <nav className="space-y-1">
            {publicLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-emerald-500/15 text-brand-emerald-400 border border-brand-emerald-500/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <Button
                asChild
                className="w-full bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold"
              >
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Go to {user.role === "admin" ? "Admin Console" : "Dashboard"}</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-slate-800 text-white"
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-bold"
                >
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Join Digital Heroes
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
