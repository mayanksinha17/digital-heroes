import { requireAdmin } from "@/modules/auth/guards";
import { AdminService } from "@/modules/admin/service";
import type { UserRole } from "@/types/database";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Users, Search, ArrowRight, ShieldCheck, Trophy, Heart } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Management | Admin Console",
  description: "Browse and inspect all registered accounts, subscriptions, scores, and winnings.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; role?: string };
}) {
  await requireAdmin();
  const query = searchParams?.q || "";
  const roleParam = searchParams?.role;
  const role = roleParam === "admin" || roleParam === "subscriber" ? (roleParam as UserRole) : undefined;

  const { users, totalCount } = await AdminService.getUsers({
    query: query || undefined,
    role,
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">User Directory</h1>
            <p className="text-xs text-slate-400">
              {totalCount} registered user account{totalCount === 1 ? "" : "s"} across subscribers and administrators
            </p>
          </div>
        </div>

        {/* Search & Filter Form */}
        <form method="GET" className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by email or name..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-brand-navy-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-10 px-4">
            Search
          </Button>
        </form>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 px-4">Subscription</th>
                <th className="pb-3 px-4">Charity Partner</th>
                <th className="pb-3 px-4 text-center">Rounds</th>
                <th className="pb-3 px-4 text-right">Prizes Won</th>
                <th className="pb-3 px-4">Joined</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 pr-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{u.fullName || "Unnamed Golfer"}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{u.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.role === "admin" ? "gold" : "outline"} className="text-[10px]">
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={u.subscriptionStatus === "active" ? "active" : "outline"}
                      className="text-[10px] capitalize"
                    >
                      {u.subscriptionStatus}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-300">
                      {u.charityName ? `${u.charityName} (${u.charityPercent}%)` : "None"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        u.scoreCount >= 5
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {u.scoreCount}/5
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {u.totalWonCents > 0 ? formatMoney(u.totalWonCents) : "₹0"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 pl-4 text-right">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs border-slate-800">
                      <Link href={`/admin/users/${u.id}`}>
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No users found matching query &quot;{query}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
