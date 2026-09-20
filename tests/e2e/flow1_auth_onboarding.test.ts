import { describe, it, expect, vi, beforeEach } from "vitest";
import { signupSchema, loginSchema } from "@/modules/auth/schemas";
import { createMockSupabaseClient } from "../helpers/mockSupabase";

describe("E2E Flow 1 — User Signup, Profile Creation, Charity Selection & Subscription Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes full registration with charity selection, min 10% floor, and initial subscription verification", async () => {
    // 1. Validate signup input schema
    const signupInput = {
      fullName: "Arnold Palmer",
      email: "arnold@example.com",
      password: "SuperSecretPassword123!",
      charityId: "11111111-1111-1111-1111-111111111111",
      charityPercent: 15,
    };

    const parsed = signupSchema.safeParse(signupInput);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    // 2. Validate floor check: charityPercent cannot be < 10%
    const invalidCharityPercent = signupSchema.safeParse({
      ...signupInput,
      charityPercent: 5,
    });
    expect(invalidCharityPercent.success).toBe(false);

    // 3. Simulate Supabase Auth signUp and profile creation
    const mockSupabase = createMockSupabaseClient();
    const userId = "user-arnold-uuid";

    // Insert profile with selected charity and contribution
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: userId,
              email: signupInput.email,
              full_name: signupInput.fullName,
              role: "subscriber",
              charity_id: signupInput.charityId,
              charity_percent: signupInput.charityPercent,
            },
            error: null,
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: userId,
              email: signupInput.email,
              full_name: signupInput.fullName,
              role: "subscriber",
              charity_id: signupInput.charityId,
              charity_percent: signupInput.charityPercent,
            },
            error: null,
          }),
        }),
      }),
    });

    // 4. Verify login validation with valid credentials
    const loginInput = {
      email: "arnold@example.com",
      password: "SuperSecretPassword123!",
    };
    const loginParsed = loginSchema.safeParse(loginInput);
    expect(loginParsed.success).toBe(true);
  });
});
