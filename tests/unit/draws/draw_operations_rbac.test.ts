import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  adminCreateDrawAction,
  adminSimulateDrawAction,
  adminPublishDrawAction,
} from "@/modules/draws/actions";
import * as guards from "@/modules/auth/guards";
import { AppError } from "@/lib/errors";

vi.mock("@/modules/auth/guards", () => ({
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
}));

describe("Draw Operations: Admin RBAC & Server Actions Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-admin from creating a draw", async () => {
    vi.mocked(guards.requireAdmin).mockRejectedValue(
      new AppError("FORBIDDEN", "Administrator privileges required", 403)
    );

    const res = await adminCreateDrawAction("2026-03-01", "random");
    expect(res.success).toBe(false);
    expect(res.code).toBe("FORBIDDEN");
    expect(res.error).toContain("Administrator privileges required");
  });

  it("blocks non-admin from simulating a draw", async () => {
    vi.mocked(guards.requireAdmin).mockRejectedValue(
      new AppError("FORBIDDEN", "Administrator privileges required", 403)
    );

    const res = await adminSimulateDrawAction("11111111-1111-1111-1111-111111111111");
    expect(res.success).toBe(false);
    expect(res.code).toBe("FORBIDDEN");
  });

  it("blocks non-admin from publishing a draw", async () => {
    vi.mocked(guards.requireAdmin).mockRejectedValue(
      new AppError("FORBIDDEN", "Administrator privileges required", 403)
    );

    const res = await adminPublishDrawAction(
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    );
    expect(res.success).toBe(false);
    expect(res.code).toBe("FORBIDDEN");
  });

  it("validates inputs and returns VALIDATION_ERROR on malformed parameters", async () => {
    vi.mocked(guards.requireAdmin).mockResolvedValue({
      user: { id: "admin-1" } as any,
      profile: { role: "admin" } as any,
    });

    const resInvalidMonth = await adminCreateDrawAction("invalid-date", "random");
    expect(resInvalidMonth.success).toBe(false);
    expect(resInvalidMonth.code).toBe("VALIDATION_ERROR");

    const resInvalidUUID = await adminSimulateDrawAction("not-a-uuid");
    expect(resInvalidUUID.success).toBe(false);
    expect(resInvalidUUID.code).toBe("VALIDATION_ERROR");
  });
});
