import type { Database, VerificationStatus, PaymentStatus } from "@/types/database";

export type { VerificationStatus, PaymentStatus };

export type DrawWinnerRow = Database["public"]["Tables"]["draw_winners"]["Row"];
export type WinnerProofRow = Database["public"]["Tables"]["winner_proofs"]["Row"];

export interface WinnerWithDetails extends DrawWinnerRow {
  draw?: {
    id: string;
    draw_month: string;
    mode: "random" | "algorithmic";
    drawn_numbers: number[] | null;
  };
  profile?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  proofs?: Array<
    WinnerProofRow & {
      signedUrl?: string;
    }
  >;
}

export interface ProofUploadSession {
  winnerId: string;
  attemptNo: number;
  storagePath: string;
  signedUploadUrl: string;
  expiresInSeconds: number;
}
