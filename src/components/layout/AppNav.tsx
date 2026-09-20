"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/modules/auth/actions";
import {
  LayoutDashboard,
  Trophy,
  Heart,
  Gift,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AppNavProps {
  user: {
    id: string;
    email: string;
    fullName?: string | null;
    role: string;
  };
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/scores", label: "Golf Scores", icon: Trophy },
  { href: "/dashboard/charity", label: "Charity & Impact", icon: Heart },
  { href: "/dashboard/winnings", label: "Winnings", icon: Gift },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user.role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-brand-navy-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-emerald-500 to-brand-emerald-700 text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
                DH
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight leading-none">
                  Digital Heroes
                </span>
                <span className="text-[10px] text-brand-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
                  Subscriber Hub
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-brand-emerald-500/15 text-brand-emerald-400 border border-brand-emerald-500/30 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin/winners"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-white max-w-[140px] truncate">
                  {user.fullName || user.email.split("@")[0]}
                </span>
                <Badge
                  variant={isAdmin ? "gold" : "active"}
                  className="text-[10px] py-0 px-1.5 h-4"
                >
                  {isAdmin ? "Admin" : "Subscriber"}
                </Badge>
              </div>

              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-brand-navy-950/95 backdrop-blur-2xl px-4 py-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">
                {user.fullName || user.email}
              </span>
              <span className="text-[10px] text-slate-400">{user.email}</span>
            </div>
            <Badge variant={isAdmin ? "gold" : "active"} className="text-[10px]">
              {isAdmin ? "Admin" : "Subscriber"}
            </Badge>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-emerald-500/15 text-brand-emerald-400 border border-brand-emerald-500/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin/winners"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Console</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400/50" />
              </Link>
            )}
          </nav>

          <div className="pt-2 border-t border-white/10">
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
