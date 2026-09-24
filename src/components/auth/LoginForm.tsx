"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

interface LoginFormProps {
  initialError?: string;
  isVerified?: boolean;
  initialMessage?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in..." : "Sign In to Dashboard"}
      {!pending && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function LoginForm({ initialError, isVerified, initialMessage }: LoginFormProps = {}) {
  const [state, formAction] = useFormState(loginAction, { success: false });

  const errorMessage = state.error || (!state.success && initialError ? initialError : undefined);

  return (
    <form action={formAction} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isVerified && !state.error && (
        <Alert className="border-brand-emerald-500/30 bg-brand-emerald-950/40 text-brand-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-brand-emerald-400" />
          <AlertDescription>
            Your email has been confirmed! Please sign in with your credentials to access your dashboard.
          </AlertDescription>
        </Alert>
      )}

      {initialMessage && !state.error && !isVerified && (
        <Alert className="border-slate-700 bg-slate-900/60 text-slate-300">
          <Info className="h-4 w-4 text-brand-emerald-400" />
          <AlertDescription>{initialMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>

      <div className="text-center text-xs text-slate-400 pt-2">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-emerald-400 font-medium hover:underline">
          Subscribe & Sign Up
        </Link>
      </div>
    </form>
  );
}
