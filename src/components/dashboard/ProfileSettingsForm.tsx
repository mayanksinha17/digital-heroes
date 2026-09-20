"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfileAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertCircle } from "lucide-react";
import type { Profile } from "@/modules/auth/service";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving Changes..." : "Save Profile Details"}
    </Button>
  );
}

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useFormState(updateProfileAction, { success: false });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert variant="success">
          <Check className="h-4 w-4" />
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={profile.full_name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address (Read Only)</Label>
        <Input
          id="email"
          type="email"
          defaultValue={profile.email}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
        <p className="text-[11px] text-slate-400">
          Email address is verified through Supabase Auth.
        </p>
      </div>

      <input type="hidden" name="charityPercent" value={profile.charity_percent} />
      <input type="hidden" name="charityId" value={profile.charity_id || ""} />

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
