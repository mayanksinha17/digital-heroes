import { requireAdmin } from "@/modules/auth/guards";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireAdmin();

  return (
    <div className="min-h-screen bg-brand-navy-950 text-foreground flex flex-col">
      <AdminNav
        user={{
          id: viewer.user.id,
          email: viewer.user.email || "",
          fullName: viewer.profile.full_name,
        }}
      />
      <main className="flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
