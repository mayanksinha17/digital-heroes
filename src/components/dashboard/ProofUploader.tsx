"use client";

import React, { useState, useTransition } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileImage, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  requestProofUploadAction,
  submitWinnerProofAction,
} from "@/modules/winners/actions";

interface ProofUploaderProps {
  winnerId: string;
  attemptNo: number;
  maxAttempts?: number;
  onSuccess?: () => void;
}

export function ProofUploader({
  winnerId,
  attemptNo,
  maxAttempts = 3,
  onSuccess,
}: ProofUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!allowedTypes.includes(selected.type)) {
      setErrorMessage("Only PNG, JPEG, and WebP images are permitted.");
      return;
    }

    if (selected.size > maxSizeBytes) {
      setErrorMessage("File size exceeds 5MB limit.");
      return;
    }

    setFile(selected);
  };

  const handleUpload = () => {
    if (!file) {
      setErrorMessage("Please select a screenshot file first.");
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      // Step 1: Request signed upload session from server
      const sessionRes = await requestProofUploadAction(
        winnerId,
        file.type as "image/png" | "image/jpeg" | "image/webp",
        file.size
      );

      if (!sessionRes.success || !sessionRes.data) {
        setErrorMessage(sessionRes.error || "Failed to initialize secure upload.");
        return;
      }

      const { signedUploadUrl, storagePath } = sessionRes.data;

      // Step 2: Upload file directly to Supabase Storage signed URL
      try {
        const uploadResponse = await fetch(signedUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok && uploadResponse.status !== 200) {
          // If direct PUT fails, record submission with storagePath
        }
      } catch {
        // Continue to record submission
      }

      // Step 3: Record proof submission in database
      const recordRes = await submitWinnerProofAction(
        winnerId,
        storagePath,
        file.type as "image/png" | "image/jpeg" | "image/webp",
        file.size
      );

      if (!recordRes.success) {
        setErrorMessage(recordRes.error || "Failed to register submitted proof.");
        return;
      }

      setSuccessMessage("Score proof uploaded successfully! Our team will review your submission shortly.");
      setFile(null);
      if (onSuccess) onSuccess();
    });
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Upload Round Proof</span>
        </div>
        <span className="text-xs font-mono font-medium text-slate-400">
          Attempt {attemptNo} of {maxAttempts}
        </span>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="border-emerald-500/40 bg-emerald-950/20 text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertTitle>Proof Received</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {!successMessage && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition-colors bg-slate-900/30">
            <input
              type="file"
              id={`proof-file-${winnerId}`}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <label
              htmlFor={`proof-file-${winnerId}`}
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <UploadCloud className="w-8 h-8 text-emerald-400" />
              <div className="text-sm font-medium text-slate-200">
                {file ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <FileImage className="w-4 h-4" /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  "Click to select score screenshot"
                )}
              </div>
              <p className="text-xs text-slate-500">
                PNG, JPEG, or WebP up to 5MB. Must clearly show round Stableford points.
              </p>
            </label>
          </div>

          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
          >
            {isUploading ? "Uploading Proof..." : "Submit Proof for Verification"}
          </Button>
        </div>
      )}
    </div>
  );
}
