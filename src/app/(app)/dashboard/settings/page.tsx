import { requireUser } from "@/modules/auth/guards";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account Settings | Digital Heroes",
  description: "Manage your profile information and security settings.",
};

export default async function SettingsPage() {
  const viewer = await requireUser();

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-sm text-slate-400">
          Manage your personal details and account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-brand-emerald-400" />
                <span>Profile Information</span>
              </CardTitle>
              <Badge variant={viewer.profile.role === "admin" ? "gold" : "secondary"}>
                {viewer.profile.role.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>
              Your public identity and contact email on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileSettingsForm profile={viewer.profile} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
