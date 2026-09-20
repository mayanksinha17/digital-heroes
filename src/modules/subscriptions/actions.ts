"use server";

import { requireUser } from "@/modules/auth/guards";
import { SubscriptionService } from "./service";
import { redirect } from "next/navigation";

export async function createCheckoutAction(planCode: "monthly" | "yearly"): Promise<void> {
  const viewer = await requireUser();
  const result = await SubscriptionService.createCheckoutForPlan(viewer.user.id, planCode);

  if (result.portalUrl) {
    redirect(result.portalUrl);
  } else if (result.checkoutUrl) {
    redirect(result.checkoutUrl);
  }
}

export async function createBillingPortalAction(): Promise<void> {
  const viewer = await requireUser();
  const portalUrl = await SubscriptionService.createPortalSession(viewer.user.id);
  redirect(portalUrl);
}
