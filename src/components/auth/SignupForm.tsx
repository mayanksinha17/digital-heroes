"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signupAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, CheckCircle2, Heart, MailCheck } from "lucide-react";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating Account..." : "Create Account & Continue"}
      {!pending && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, { success: false });
  const [charityPercent, setCharityPercent] = useState<number>(10);

  if (state.requiresConfirmation) {
    return (
      <div className="space-y-6 text-center py-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-emerald-500/10 border border-brand-emerald-500/20 text-brand-emerald-400">
          <MailCheck className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-white">
            Confirm your email address
          </h3>
          <p className="text-sm text-slate-300">
            We&apos;ve sent a confirmation link to:
          </p>
          <p className="text-sm font-semibold text-brand-emerald-400 bg-brand-emerald-950/40 py-1.5 px-3 rounded-lg border border-brand-emerald-500/20 inline-block break-all">
            {state.email}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400 text-left space-y-2">
          <p className="font-medium text-slate-300">Next Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Open the confirmation email in your inbox.</li>
            <li>Click the link inside to verify your email address.</li>
            <li>Return to Digital Heroes and sign in to access your dashboard.</li>
          </ol>
        </div>

        <div className="pt-2">
          <Link href="/login">
            <Button className="w-full">
              Proceed to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          Didn&apos;t receive the email? Check your spam/junk folder.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="e.g. Alex Morgan"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="alex@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password (min. 6 characters)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2 rounded-xl border border-brand-emerald-500/20 bg-brand-emerald-950/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-emerald-300">
            <Heart className="h-3.5 w-3.5 text-brand-emerald-400" />
            <span>Charity Contribution</span>
          </div>
          <span className="rounded-md bg-brand-emerald-500/20 px-2 py-0.5 text-xs font-bold text-brand-emerald-400">
            {charityPercent}% of subscription
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="50"
          step="5"
          value={charityPercent}
          onChange={(e) => setCharityPercent(Number(e.target.value))}
          className="w-full accent-brand-emerald-500 cursor-pointer"
        />
        <input type="hidden" name="charityPercent" value={charityPercent} />

        <p className="text-[11px] text-slate-400">
          Minimum 10% guaranteed to verified charities. You can voluntarily increase your impact anytime.
        </p>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>

      <div className="text-center text-xs text-slate-400 pt-2">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-emerald-400 font-medium hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
