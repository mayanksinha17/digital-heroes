"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateCharitySelectionAction } from "@/modules/charities/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Check, Sparkles, AlertCircle } from "lucide-react";
import type { Charity } from "@/modules/charities/service";

interface CharityPickerProps {
  charities: Charity[];
  currentCharityId: string | null;
  currentCharityPercent: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving Preference..." : "Save Charity Preference"}
    </Button>
  );
}

export function CharityPicker({
  charities,
  currentCharityId,
  currentCharityPercent,
}: CharityPickerProps) {
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(currentCharityId);
  const [percent, setPercent] = useState<number>(currentCharityPercent || 10);
  const [state, formAction] = useFormState(updateCharitySelectionAction, { success: false });

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
          <AlertDescription>Your charity preference has been updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Grid of Charities */}
      <div className="space-y-2">
        <Label>Select Beneficiary Charity</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {charities.map((charity) => {
            const isSelected = selectedCharityId === charity.id;
            return (
              <div
                key={charity.id}
                onClick={() => setSelectedCharityId(charity.id)}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  isSelected
                    ? "border-brand-emerald-500 bg-brand-emerald-950/40 shadow-lg shadow-brand-emerald-950/50"
                    : "border-white/10 bg-brand-navy-900/60 hover:bg-brand-navy-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Heart className={`h-4 w-4 ${isSelected ? "text-brand-emerald-400" : "text-slate-400"}`} />
                      <span>{charity.name}</span>
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {charity.short_description}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-emerald-500 text-brand-navy-900 font-bold">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <input type="hidden" name="charityId" value={selectedCharityId || ""} />

      {/* Contribution percentage slider */}
      <div className="space-y-3 rounded-2xl border border-brand-emerald-500/20 bg-brand-emerald-950/20 p-5">
        <div className="flex items-center justify-between">
          <Label className="text-brand-emerald-300">Monthly Contribution Percentage</Label>
          <span className="rounded-lg bg-brand-emerald-500/20 px-2.5 py-1 text-xs font-bold text-brand-emerald-300">
            {percent}% of subscription
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="50"
          step="5"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="w-full accent-brand-emerald-500 cursor-pointer"
        />
        <input type="hidden" name="charityPercent" value={percent} />

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>10% (PRD Minimum)</span>
          <span>25%</span>
          <span>50% (Generous Hero)</span>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
