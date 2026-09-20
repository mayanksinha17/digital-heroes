import { SignupForm } from "@/components/auth/SignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Digital Heroes",
  description: "Join Digital Heroes to track your golf scores, donate to charities, and win monthly prizes.",
};

export default function SignupPage() {
  return (
    <Card className="glass-card">
      <CardHeader className="space-y-1">
        <CardTitle>Join Digital Heroes</CardTitle>
        <CardDescription>
          Create your account, select your charity contribution rate, and start playing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
