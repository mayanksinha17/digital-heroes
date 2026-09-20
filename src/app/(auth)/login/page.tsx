import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Digital Heroes",
  description: "Sign in to your Digital Heroes subscriber or administrator account.",
};

export default function LoginPage() {
  return (
    <Card className="glass-card">
      <CardHeader className="space-y-1">
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Enter your email and password to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
