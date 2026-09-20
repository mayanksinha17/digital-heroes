import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin, requireUser } from "@/modules/auth/guards";
import { AuthService } from "@/modules/auth/service";
import { AppError } from "@/lib/errors";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("E2E Flow 7 — Route Protection & Unauthorized Admin Access Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users attempting to access protected endpoints", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
      },
    });

    await expect(requireUser(false)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      httpStatus: 401,
    });
    await expect(requireAdmin(false)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      httpStatus: 401,
    });
  });

  it("rejects regular subscribers attempting to access admin control surfaces", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "subscriber-user-1", email: "sub@example.com" } },
          error: null,
        }),
      },
    });

    vi.spyOn(AuthService, "getProfileById").mockResolvedValue({
      id: "subscriber-user-1",
      email: "sub@example.com",
      full_name: "John Doe",
      role: "subscriber",
      charity_id: null,
      charity_percent: 10,
      stripe_customer_id: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    // requireUser succeeds
    const viewer = await requireUser(false);
    expect(viewer.profile.id).toBe("subscriber-user-1");

    // requireAdmin fails with FORBIDDEN (403)
    await expect(requireAdmin(false)).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });
  });
});
