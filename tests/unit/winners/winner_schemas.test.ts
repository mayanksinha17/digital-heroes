import { describe, it, expect } from "vitest";
import {
  proofMimeTypeSchema,
  proofFileSizeSchema,
  requestProofUploadSchema,
  recordProofSubmissionSchema,
  adminReviewWinnerSchema,
  adminMarkPaidSchema,
} from "@/modules/winners/schemas";

describe("Winner Domain Schemas Validation (PRD §09 & D-32, D-33)", () => {
  describe("Proof File MIME Type & Size Boundaries", () => {
    it("accepts valid image MIME types (PNG, JPEG, WebP)", () => {
      expect(proofMimeTypeSchema.safeParse("image/png").success).toBe(true);
      expect(proofMimeTypeSchema.safeParse("image/jpeg").success).toBe(true);
      expect(proofMimeTypeSchema.safeParse("image/webp").success).toBe(true);
    });

    it("rejects invalid MIME types (PDF, GIF, Executables)", () => {
      expect(proofMimeTypeSchema.safeParse("application/pdf").success).toBe(false);
      expect(proofMimeTypeSchema.safeParse("image/gif").success).toBe(false);
      expect(proofMimeTypeSchema.safeParse("application/octet-stream").success).toBe(false);
      expect(proofMimeTypeSchema.safeParse("text/html").success).toBe(false);
    });

    it("accepts valid file sizes up to 5MB (5,242,880 bytes)", () => {
      expect(proofFileSizeSchema.safeParse(1024).success).toBe(true); // 1KB
      expect(proofFileSizeSchema.safeParse(2 * 1024 * 1024).success).toBe(true); // 2MB
      expect(proofFileSizeSchema.safeParse(5242880).success).toBe(true); // Exactly 5MB
    });

    it("rejects empty files (0 bytes) and oversized files (> 5MB)", () => {
      expect(proofFileSizeSchema.safeParse(0).success).toBe(false);
      expect(proofFileSizeSchema.safeParse(-100).success).toBe(false);
      expect(proofFileSizeSchema.safeParse(5242881).success).toBe(false); // 5MB + 1 byte
      expect(proofFileSizeSchema.safeParse(10 * 1024 * 1024).success).toBe(false); // 10MB
    });
  });

  describe("Composite Request & Review Schemas", () => {
    const validWinnerId = "a0000000-0000-0000-0000-000000000001";

    it("validates requestProofUploadSchema", () => {
      const valid = requestProofUploadSchema.safeParse({
        winnerId: validWinnerId,
        mimeType: "image/png",
        sizeBytes: 1500000,
      });
      expect(valid.success).toBe(true);
    });

    it("validates recordProofSubmissionSchema", () => {
      const valid = recordProofSubmissionSchema.safeParse({
        winnerId: validWinnerId,
        storagePath: "user-1/winner-1/attempt-1.png",
        mimeType: "image/png",
        sizeBytes: 1500000,
      });
      expect(valid.success).toBe(true);
    });

    it("validates adminReviewWinnerSchema with note", () => {
      const valid = adminReviewWinnerSchema.safeParse({
        winnerId: validWinnerId,
        status: "approved",
        note: "Verified against Stableford scorecard",
      });
      expect(valid.success).toBe(true);
    });

    it("validates adminMarkPaidSchema", () => {
      const valid = adminMarkPaidSchema.safeParse({
        winnerId: validWinnerId,
      });
      expect(valid.success).toBe(true);
    });
  });
});
