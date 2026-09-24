import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction, signupAction } from "@/modules/auth/actions";
import { createMockSupabaseClient } from "../../helpers/mockSupabase";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: () => ({
    get: (key: string) => {
      if (key === "host") return "digital-heroes-one-tau.vercel.app";
      if (key === "x-forwarded-proto") return "https";
      return null;
    },
  }),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  }),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock Supabase server client
let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

// Mock AuthService
vi.mock("@/modules/auth/service", () => ({
  AuthService: {
    getProfileById: vi.fn().mockImplementation((userId: string) => {
      if (userId === "admin-user-id") {
        return Promise.resolve({ id: userId, role: "admin" });
      }
      return Promise.resolve({ id: userId, role: "subscriber" });
    }),
  },
}));

describe("Auth Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  describe("signupAction", () => {
    it("returns requiresConfirmation: true and email when email confirmation is required (session is null)", async () => {
      mockSupabase.auth.signUp = vi.fn().mockResolvedValue({
        data: {
          user: { id: "new-user-id", email: "golfer@example.com" },
          session: null, // Email confirmation required!
        },
        error: null,
      });

      const formData = new FormData();
      formData.set("fullName", "Gary Player");
      formData.set("email", "  Golfer@Example.COM  ");
      formData.set("password", "securepassword123");
      formData.set("charityPercent", "15");

      const result = await signupAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.email).toBe("golfer@example.com");

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "golfer@example.com",
          options: expect.objectContaining({
            emailRedirectTo: "https://digital-heroes-one-tau.vercel.app/auth/callback",
          }),
        })
      );
    });

    it("redirects to /dashboard if session is immediately provided (confirmation disabled)", async () => {
      mockSupabase.auth.signUp = vi.fn().mockResolvedValue({
        data: {
          user: { id: "new-user-id", email: "golfer@example.com" },
          session: { access_token: "token123" },
        },
        error: null,
      });

      const formData = new FormData();
      formData.set("fullName", "Jack Nicklaus");
      formData.set("email", "jack@example.com");
      formData.set("password", "securepassword123");

      await expect(signupAction(null, formData)).rejects.toThrow("REDIRECT:/dashboard");
    });

    it("returns error message when Supabase returns error on signup", async () => {
      mockSupabase.auth.signUp = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" },
      });

      const formData = new FormData();
      formData.set("fullName", "Jack Nicklaus");
      formData.set("email", "jack@example.com");
      formData.set("password", "securepassword123");

      const result = await signupAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("User already registered");
    });
  });

  describe("loginAction", () => {
    it("redirects to /dashboard for subscriber with valid credentials", async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: {
          user: { id: "subscriber-id", email: "golfer@example.com" },
          session: { access_token: "token123" },
        },
        error: null,
      });

      const formData = new FormData();
      formData.set("email", "  Golfer@Example.COM  ");
      formData.set("password", "password123");

      await expect(loginAction(null, formData)).rejects.toThrow("REDIRECT:/dashboard");
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "golfer@example.com",
        password: "password123",
      });
    });

    it("redirects to /admin for admin role", async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: {
          user: { id: "admin-user-id", email: "admin@digitalheroes.example" },
          session: { access_token: "token123" },
        },
        error: null,
      });

      const formData = new FormData();
      formData.set("email", "admin@digitalheroes.example");
      formData.set("password", "adminpassword123");

      await expect(loginAction(null, formData)).rejects.toThrow("REDIRECT:/admin");
    });

    it("provides helpful error when email is unconfirmed", async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email not confirmed", code: "email_not_confirmed" },
      });

      const formData = new FormData();
      formData.set("email", "unconfirmed@example.com");
      formData.set("password", "password123");

      const result = await loginAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Your email address has not been confirmed yet");
    });

    it("handles invalid credentials error appropriately", async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      const formData = new FormData();
      formData.set("email", "test@example.com");
      formData.set("password", "wrongpassword");

      const result = await loginAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid login credentials");
    });
  });
});
