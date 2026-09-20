import { requireAdmin } from "@/modules/auth/guards";
import { CharityService } from "@/modules/charities/service";
import { CharityForm } from "@/components/admin/CharityForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Charity | Digital Heroes Admin",
};

interface EditCharityPageProps {
  params: {
    id: string;
  };
}

export default async function EditCharityPage({ params }: EditCharityPageProps) {
  await requireAdmin();
  const charity = await CharityService.getCharityById(params.id);

  if (!charity) {
    notFound();
  }

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
          <CardTitle>Edit Charity: {charity.name}</CardTitle>
          <CardDescription>
            Update partner information, storytelling, media links, and spotlight visibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CharityForm charity={charity} />
        </CardContent>
      </Card>
    </div>
  );
}
