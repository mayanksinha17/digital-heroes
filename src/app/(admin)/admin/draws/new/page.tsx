import { requireAdmin } from "@/modules/auth/guards";
import { DrawService } from "@/modules/draws/service";
import { CreateDrawForm } from "@/components/admin/CreateDrawForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Initialize Monthly Draw | Admin Console",
  description: "Create a draft draw for the monthly cycle.",
};

export default async function AdminNewDrawPage() {
  await requireAdmin();
  const latestPublished = await DrawService.getLatestPublishedDraw();
  const incomingRolloverCents = Number(latestPublished?.rollover_out_cents || 0);

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          <Link href="/admin/draws">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Draws</span>
          </Link>
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Initialize Monthly Draw Cycle</span>
          </CardTitle>
          <CardDescription>
            Creates a draft draw in the platform. Draws must be simulated and verified prior to atomic publication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDrawForm incomingRolloverCents={incomingRolloverCents} />
        </CardContent>
      </Card>
    </div>
  );
}
