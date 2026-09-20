import { requireAdmin } from "@/modules/auth/guards";
import { CharityForm } from "@/components/admin/CharityForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Charity Partner | Digital Heroes Admin",
};

export default async function NewCharityPage() {
  await requireAdmin();

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Link
        href="/admin/charities"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Charities List</span>
      </Link>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Add New Charity Partner</CardTitle>
          <CardDescription>
            Register a verified non-profit partner eligible for subscriber contributions and donations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CharityForm />
        </CardContent>
      </Card>
    </div>
  );
}
