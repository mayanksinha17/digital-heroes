"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminArchiveCharityAction } from "@/modules/charities/actions";
import { Edit2, Archive, Plus, Heart, Sparkles } from "lucide-react";
import type { Charity } from "@/modules/charities/service";

export function CharityAdminTable({ charities }: { charities: Charity[] }) {
  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate/archive "${name}"? Existing contributions will be preserved.`)) {
      await adminArchiveCharityAction(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Charity Management</h2>
          <p className="text-xs text-slate-400">
            PRD §11 Control Surface 03 · Manage partner listings, media, events, and spotlight status.
          </p>
        </div>
        <Link href="/admin/charities/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Charity</span>
          </Button>
        </Link>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-brand-navy-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Charity Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Spotlight</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {charities.length > 0 ? (
                charities.map((charity) => (
                  <tr key={charity.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Heart className="h-4 w-4 text-brand-emerald-400" />
                        <span>{charity.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">{charity.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-300">{charity.category || "General"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {charity.is_active && !charity.archived_at ? (
                        <Badge variant="active">Active</Badge>
                      ) : (
                        <Badge variant="inactive">Archived</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {charity.is_featured ? (
                        <Badge variant="gold" className="text-[10px]">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Order #{charity.featured_order || 1}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/admin/charities/${charity.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-2.5">
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      {charity.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(charity.id, charity.name)}
                          className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No charities found in database. Click &quot;Add Charity&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
