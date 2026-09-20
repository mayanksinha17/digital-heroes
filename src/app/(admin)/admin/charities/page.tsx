import { requireAdmin } from "@/modules/auth/guards";
import { CharityService } from "@/modules/charities/service";
import { CharityAdminTable } from "@/components/admin/CharityAdminTable";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Charity Management | Digital Heroes Admin",
  description: "Administer charitable partners, spotlights, and events.",
};

export default async function AdminCharitiesPage() {
  await requireAdmin();
  const charities = await CharityService.getAllCharitiesAdmin();

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <CharityAdminTable charities={charities} />
    </div>
  );
}
