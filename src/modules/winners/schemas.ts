import { z } from "zod";

export const proofMimeTypeSchema = z.enum(
  ["image/png", "image/jpeg", "image/webp"],
  {
    required_error: "Proof file type is required",
    invalid_type_error: "Only PNG, JPEG, and WebP image formats are permitted",
  }
);

export const proofFileSizeSchema = z
  .number({
    required_error: "File size is required",
    invalid_type_error: "File size must be a number",
  })
  .int("File size must be an integer")
  .min(1, "File cannot be empty")
  .max(5242880, "File size cannot exceed 5MB (5,242,880 bytes)");

export const requestProofUploadSchema = z.object({
  winnerId: z.string().uuid("Invalid winner record ID"),
  mimeType: proofMimeTypeSchema,
  sizeBytes: proofFileSizeSchema,
});

export const recordProofSubmissionSchema = z.object({
  winnerId: z.string().uuid("Invalid winner record ID"),
  storagePath: z
    .string({ required_error: "Storage path is required" })
    .min(5, "Invalid storage path"),
  mimeType: proofMimeTypeSchema,
  sizeBytes: proofFileSizeSchema,
});

export const adminReviewWinnerSchema = z.object({
  winnerId: z.string().uuid("Invalid winner record ID"),
  status: z.enum(["approved", "rejected"], {
    required_error: "Review status must be either 'approved' or 'rejected'",
  }),
  note: z.string().max(500, "Review note must not exceed 500 characters").optional(),
});

export const adminMarkPaidSchema = z.object({
  winnerId: z.string().uuid("Invalid winner record ID"),
});

export type RequestProofUploadInput = z.infer<typeof requestProofUploadSchema>;
export type RecordProofSubmissionInput = z.infer<typeof recordProofSubmissionSchema>;
export type AdminReviewWinnerInput = z.infer<typeof adminReviewWinnerSchema>;
export type AdminMarkPaidInput = z.infer<typeof adminMarkPaidSchema>;
