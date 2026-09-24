import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Digital Heroes",
  description: "Sign in to your Digital Heroes subscriber or administrator account.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const error = typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const verified = searchParams?.verified === "true" || searchParams?.confirmed === "true";
  const message = typeof searchParams?.message === "string" ? searchParams.message : undefined;

  return (
    <Card className="glass-card">
      <CardHeader className="space-y-1">
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Enter your email and password to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm initialError={error} isVerified={verified} initialMessage={message} />
      </CardContent>
    </Card>
  );
}
