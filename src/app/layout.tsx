import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Digital Heroes | Subscription Golf, Charity Impact & Monthly Draws",
  description:
    "Track your Stableford golf rounds, support verified charities with every subscription, and win in monthly draw prize pools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-brand-navy-900 text-foreground font-sans selection:bg-brand-emerald-500/20 selection:text-brand-emerald-400">
        {children}
      </body>
    </html>
  );
}
