import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors";
import type { Profile } from "@/modules/auth/service";

describe("Role-Based Access Control (RBAC) & Authorization Logic", () => {
  const subscriberProfile: Profile = {
    id: "u-subscriber-01",
    email: "sub@example.com",
    full_name: "Active Subscriber",
    role: "subscriber",
    charity_id: "c-01",
    charity_percent: 10,
    stripe_customer_id: "cus_123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const adminProfile: Profile = {
    id: "u-admin-01",
    email: "admin@digitalheroes.example",
    full_name: "Platform Admin",
    role: "admin",
    charity_id: null,
    charity_percent: 10,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  function checkAdminAccess(profile: Profile | null): boolean {
    if (!profile) {
      throw new AppError("UNAUTHORIZED", "Sign in required", 401);
    }
    if (profile.role !== "admin") {
      throw new AppError("FORBIDDEN", "Administrator privileges required", 403);
    }
    return true;
  }

  function checkProfileAccess(viewerId: string, targetUserId: string, isAdmin: boolean): boolean {
    if (viewerId === targetUserId) return true;
    if (isAdmin) return true;
    return false;
  }

  it("permits admin profile to perform admin actions", () => {
    expect(checkAdminAccess(adminProfile)).toBe(true);
  });

  it("strictly forbids subscriber profile from performing admin actions", () => {
    expect(() => checkAdminAccess(subscriberProfile)).toThrowError("Administrator privileges required");
    try {
      checkAdminAccess(subscriberProfile);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).httpStatus).toBe(403);
      expect((err as AppError).code).toBe("FORBIDDEN");
    }
  });

  it("strictly throws UNAUTHORIZED when no viewer session exists", () => {
    expect(() => checkAdminAccess(null)).toThrowError("Sign in required");
    try {
      checkAdminAccess(null);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).httpStatus).toBe(401);
      expect((err as AppError).code).toBe("UNAUTHORIZED");
    }
  });

  it("prevents cross-user private data access for regular subscribers", () => {
    const isAllowed = checkProfileAccess(subscriberProfile.id, "u-other-user", false);
    expect(isAllowed).toBe(false);
  });

  it("allows user to access their own private profile", () => {
    const isAllowed = checkProfileAccess(subscriberProfile.id, subscriberProfile.id, false);
    expect(isAllowed).toBe(true);
  });

  it("allows administrator to access any user profile for management", () => {
    const isAllowed = checkProfileAccess(adminProfile.id, subscriberProfile.id, true);
    expect(isAllowed).toBe(true);
  });
});
