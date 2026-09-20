import { requireUser } from "@/modules/auth/guards";
import { AppNav } from "@/components/layout/AppNav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireUser();

  return (
    <div className="min-h-screen bg-brand-navy-950 text-foreground flex flex-col">
      <AppNav
        user={{
          id: viewer.user.id,
          email: viewer.user.email || "",
          fullName: viewer.profile.full_name,
          role: viewer.profile.role,
        }}
      />
      <main className="flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
