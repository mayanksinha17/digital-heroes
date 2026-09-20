import { CharityService } from "@/modules/charities/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MapPin, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface CharityDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: CharityDetailPageProps): Promise<Metadata> {
  const charity = await CharityService.getCharityBySlug(params.slug);
  if (!charity) {
    return { title: "Charity Not Found | Digital Heroes" };
  }
  return {
    title: `${charity.name} | Digital Heroes Charity Partner`,
    description: charity.short_description,
  };
}

export default async function CharityDetailPage({ params }: CharityDetailPageProps) {
  const charity = await CharityService.getCharityBySlug(params.slug);
  if (!charity) {
    notFound();
  }

  const events = await CharityService.getCharityEvents(charity.id);

  return (
    <div className="min-h-screen bg-brand-navy-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/charities"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Charities Directory</span>
        </Link>

        <div className="glass-card rounded-3xl p-8 sm:p-10 space-y-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-emerald-950/80 border border-brand-emerald-500/40 text-brand-emerald-400 font-bold text-2xl shadow-lg shadow-brand-emerald-900/30">
                <Heart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {charity.name}
                </h1>
                {charity.category && (
                  <Badge variant="secondary" className="mt-1.5">
                    {charity.category}
                  </Badge>
                )}
              </div>
            </div>

            {charity.is_featured && (
              <Badge variant="gold" className="px-3 py-1 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured Partner
              </Badge>
            )}
          </div>

          <p className="text-lg text-slate-200 leading-relaxed font-medium">
            {charity.short_description}
          </p>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed border-t border-white/10 pt-6">
            <h3 className="text-base font-bold text-white mb-2">Our Mission & Impact</h3>
            <p className="whitespace-pre-line">{charity.description}</p>
          </div>

          {charity.website_url && (
            <div className="pt-2">
              <a
                href={charity.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-emerald-400 hover:underline font-semibold"
              >
                <span>Visit Official Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/10">
            <Link href={`/signup?charity=${charity.id}`}>
              <Button size="lg" className="gap-2">
                <Heart className="h-4 w-4" />
                <span>Support via Monthly Subscription</span>
              </Button>
            </Link>
            <Link href={`/dashboard/donate?charity=${charity.id}`}>
              <Button variant="outline" size="lg">
                Make an Independent Donation
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-copper-400" />
              <span>Upcoming Charity Events & Golf Days</span>
            </h2>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <div key={event.id} className="glass-card rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-brand-copper-300 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.starts_at)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{event.title}</h3>
                  {event.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 text-center text-xs text-slate-400">
              No upcoming events currently scheduled for {charity.name}. Check back soon!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
