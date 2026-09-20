"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminCreateCharityAction, adminUpdateCharityAction } from "@/modules/charities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Charity } from "@/modules/charities/service";

interface CharityFormProps {
  charity?: Charity;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? isEditing
          ? "Saving Changes..."
          : "Creating Charity..."
        : isEditing
        ? "Save Charity Changes"
        : "Create Charity Partner"}
    </Button>
  );
}

export function CharityForm({ charity }: CharityFormProps) {
  const isEditing = Boolean(charity);
  const action = isEditing ? adminUpdateCharityAction : adminCreateCharityAction;
  const [state, formAction] = useFormState(action, { success: false });

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert variant="success">
          <Check className="h-4 w-4" />
          <AlertDescription>Charity saved successfully!</AlertDescription>
        </Alert>
      )}

      {isEditing && <input type="hidden" name="id" value={charity!.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Charity Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={charity?.name}
            placeholder="e.g. Green Fairways Conservation"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL identifier)</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={charity?.slug}
            placeholder="e.g. green-fairways"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={charity?.category || "Youth & Sports"}
            placeholder="e.g. Youth & Sports, Environment"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={charity?.website_url || ""}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description (Summary)</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          defaultValue={charity?.short_description}
          placeholder="One-line summary for cards and lists"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detailed Description & Mission</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={charity?.description}
          placeholder="Comprehensive storytelling about the charity's mission and initiatives..."
          className="flex w-full rounded-xl border border-white/10 bg-brand-navy-900/90 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-white/10 bg-brand-navy-900/50">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            value="true"
            defaultChecked={charity?.is_featured || false}
            className="h-4 w-4 rounded accent-brand-emerald-500"
          />
          <Label htmlFor="isFeatured" className="cursor-pointer">
            Spotlight Featured on Homepage
          </Label>
        </div>

        <div className="space-y-1">
          <Label htmlFor="featuredOrder">Featured Order (Optional)</Label>
          <Input
            id="featuredOrder"
            name="featuredOrder"
            type="number"
            defaultValue={charity?.featured_order || 1}
            min="1"
            className="h-9"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link href="/admin/charities">
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}
