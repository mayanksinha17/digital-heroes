import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema, updateProfileSchema } from "@/modules/auth/schemas";

describe("Auth Schemas", () => {
  describe("loginSchema", () => {
    it("validates correct credentials", () => {
      const result = loginSchema.safeParse({
        email: "subscriber@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email and short password", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("signupSchema (PRD §08 & BR-21)", () => {
    it("accepts valid signup with default 10% charity contribution", () => {
      const result = signupSchema.safeParse({
        fullName: "Tiger Woods",
        email: "tiger@example.com",
        password: "securepassword",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.charityPercent).toBe(10);
      }
    });

    it("accepts increased charity percentage (e.g. 25%)", () => {
      const result = signupSchema.safeParse({
        fullName: "Rory McIlroy",
        email: "rory@example.com",
        password: "securepassword",
        charityPercent: 25,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.charityPercent).toBe(25);
      }
    });

    it("strictly rejects charity contribution below 10%", () => {
      const result = signupSchema.safeParse({
        fullName: "Test User",
        email: "test@example.com",
        password: "securepassword",
        charityPercent: 9,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Minimum charity contribution is 10%");
      }
    });
  });

  describe("updateProfileSchema", () => {
    it("validates valid profile updates", () => {
      const result = updateProfileSchema.safeParse({
        fullName: "Updated Name",
        charityPercent: 20,
      });
      expect(result.success).toBe(true);
    });
  });
});
