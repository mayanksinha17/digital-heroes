import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "@/modules/auth/guards";
import { AuthService } from "@/modules/auth/service";
import { adminCreateDrawAction, adminSimulateDrawAction, adminPublishDrawAction } from "@/modules/draws/actions";
import { adminReviewWinnerAction, adminMarkWinnerPaidAction } from "@/modules/winners/actions";

// Mock Supabase clients & auth
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/modules/auth/guards", () => ({
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
}));

describe("Admin RBAC & Security Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks subscriber from invoking adminCreateDrawAction", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new AppError("FORBIDDEN", "Admin access required", 403)
    );

    const res = await adminCreateDrawAction("2026-09-01", "random");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Admin access required");
    expect(res.code).toBe("FORBIDDEN");
  });

  it("blocks subscriber from invoking adminSimulateDrawAction", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new AppError("FORBIDDEN", "Admin access required", 403)
    );

    const validUuid = "11111111-1111-1111-1111-111111111111";
    const res = await adminSimulateDrawAction(validUuid, "random");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Admin access required");
    expect(res.code).toBe("FORBIDDEN");
  });

  it("blocks subscriber from invoking adminPublishDrawAction", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new AppError("FORBIDDEN", "Admin access required", 403)
    );

    const validUuid1 = "11111111-1111-1111-1111-111111111111";
    const validUuid2 = "22222222-2222-2222-2222-222222222222";
    const res = await adminPublishDrawAction(validUuid1, validUuid2);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Admin access required");
    expect(res.code).toBe("FORBIDDEN");
  });

  it("blocks subscriber from reviewing winner proof", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new AppError("FORBIDDEN", "Admin access required", 403)
    );

    const validUuid = "11111111-1111-1111-1111-111111111111";
    const res = await adminReviewWinnerAction(validUuid, "approved", "Looks good");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Admin access required");
  });

  it("blocks subscriber from marking winner paid", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new AppError("FORBIDDEN", "Admin access required", 403)
    );

    const validUuid = "11111111-1111-1111-1111-111111111111";
    const res = await adminMarkWinnerPaidAction(validUuid);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Admin access required");
  });
});
