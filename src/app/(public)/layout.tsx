import { createClient } from "@/lib/supabase/server";
import { AuthService } from "@/modules/auth/service";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userSummary = null;
  if (user) {
    const profile = await AuthService.getProfileById(user.id);
    userSummary = {
      id: user.id,
      email: user.email || "",
      role: profile?.role || "subscriber",
    };
  }

  return (
    <div className="min-h-screen bg-brand-navy-950 text-foreground flex flex-col justify-between">
      <PublicNav user={userSummary} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
