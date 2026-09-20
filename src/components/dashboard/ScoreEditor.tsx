"use client";

import React, { useState, useTransition } from "react";
import {
  Trophy,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  TrendingUp,
  Sparkles,
  Info,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScoreSlot } from "@/components/motion/ScoreSlot";
import {
  addScoreAction,
  updateScoreAction,
  deleteScoreAction,
  type ScoreActionResult,
} from "@/modules/scores/actions";
import type { GolfScore } from "@/modules/scores/service";
import Link from "next/link";

interface ScoreEditorProps {
  initialScores: GolfScore[];
  isSubscriber: boolean;
}

export function ScoreEditor({ initialScores, isSubscriber }: ScoreEditorProps) {
  const [scores, setScores] = useState<GolfScore[]>(initialScores);
  const [isPending, startTransition] = useTransition();

  // Add form state
  const todayStr = new Date().toISOString().split("T")[0];
  const [scoreValue, setScoreValue] = useState<number>(36);
  const [playedOn, setPlayedOn] = useState<string>(todayStr);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit Modal state
  const [editingScore, setEditingScore] = useState<GolfScore | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<number>(36);
  const [editPlayedOn, setEditPlayedOn] = useState<string>("");

  // Delete Modal state
  const [deletingScore, setDeletingScore] = useState<GolfScore | null>(null);

  // Stats
  const scoreCount = scores.length;
  const averageScore =
    scoreCount > 0
      ? (scores.reduce((acc, curr) => acc + curr.score, 0) / scoreCount).toFixed(1)
      : null;
  const highestScore = scoreCount > 0 ? Math.max(...scores.map((s) => s.score)) : null;

  // Check if selected date already exists in current scores
  const duplicateScore = scores.find((s) => s.played_on === playedOn);

  const handleAddScore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (scoreValue < 1 || scoreValue > 45) {
      setErrorMessage("Stableford score must be between 1 and 45.");
      return;
    }

    if (!playedOn) {
      setErrorMessage("Please select the date played.");
      return;
    }

    startTransition(async () => {
      const res: ScoreActionResult<GolfScore> = await addScoreAction(scoreValue, playedOn);

      if (!res.success) {
        setErrorMessage(res.error || "Failed to record score.");
        return;
      }

      setSuccessMessage(`Stableford score of ${scoreValue} recorded successfully!`);

      // Optimistically update local list and re-sort / trim
      if (res.data) {
        const updatedList = [
          res.data,
          ...scores.filter((s) => s.id !== res.data?.id && s.played_on !== res.data?.played_on),
        ]
          .sort((a, b) => new Date(b.played_on).getTime() - new Date(a.played_on).getTime())
          .slice(0, 5);

        setScores(updatedList);
      }
    });
  };

  const handleStartEdit = (score: GolfScore) => {
    setEditingScore(score);
    setEditScoreValue(score.score);
    setEditPlayedOn(score.played_on);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScore) return;
    setErrorMessage(null);

    if (editScoreValue < 1 || editScoreValue > 45) {
      setErrorMessage("Stableford score must be between 1 and 45.");
      return;
    }

    startTransition(async () => {
      const res = await updateScoreAction(editingScore.id, editScoreValue, editPlayedOn);

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update score.");
        return;
      }

      setSuccessMessage("Score updated successfully.");
      if (res.data) {
        const updatedList = scores
          .map((s) => (s.id === editingScore.id ? res.data! : s))
          .sort((a, b) => new Date(b.played_on).getTime() - new Date(a.played_on).getTime())
          .slice(0, 5);

        setScores(updatedList);
      }
      setEditingScore(null);
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingScore) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await deleteScoreAction(deletingScore.id);

      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete score.");
        return;
      }

      setSuccessMessage("Score removed.");
      setScores(scores.filter((s) => s.id !== deletingScore.id));
      setDeletingScore(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* Non-subscriber restriction banner */}
      {!isSubscriber && (
        <Alert variant="warning" className="border-amber-500/40 bg-amber-950/20 text-amber-300">
          <Lock className="h-5 w-5 text-amber-400" />
          <AlertTitle className="font-semibold text-amber-200">
            Subscription Required for Score Entry
          </AlertTitle>
          <AlertDescription className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>
              An active Digital Heroes subscription is required to log scores and enter monthly
              draws.
            </span>
            <Button asChild size="sm" variant="default" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shrink-0">
              <Link href="/pricing">Subscribe Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="border-emerald-500/40 bg-emerald-950/20 text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Retained Rounds
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {scoreCount} <span className="text-slate-500 text-sm font-normal">/ 5 max</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Average Stableford
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {averageScore ?? "—"}{" "}
                <span className="text-slate-500 text-sm font-normal">pts</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Draw Status
              </p>
              <h3 className="text-base font-bold text-white mt-1">
                {scoreCount >= 5 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Qualified for Draws
                  </span>
                ) : (
                  <span className="text-amber-400">
                    {5 - scoreCount} more round{5 - scoreCount > 1 ? "s" : ""} needed
                  </span>
                )}
              </h3>
            </div>
            <Badge
              variant={scoreCount >= 5 ? "active" : "outline"}
              className={scoreCount >= 5 ? "bg-emerald-500/20 text-emerald-400" : "border-slate-700 text-slate-400"}
            >
              {scoreCount >= 5 ? "5/5 Active" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Form + Score Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Score Submission Form */}
        <div className="lg:col-span-5">
          <Card className="bg-slate-900/80 border-slate-800 shadow-xl backdrop-blur-sm sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Log Golf Round
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Enter your Stableford points (1–45) and the date played.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddScore} className="space-y-5">
                {/* Score Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="score" className="text-xs font-medium text-slate-300">
                      Stableford Points (1–45)
                    </Label>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {scoreValue} pts
                    </span>
                  </div>
                  <Input
                    id="score"
                    type="number"
                    min={1}
                    max={45}
                    value={scoreValue}
                    disabled={!isSubscriber || isPending}
                    onChange={(e) => setScoreValue(Number(e.target.value))}
                    className="bg-slate-950 border-slate-800 text-lg font-mono"
                    required
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {[28, 32, 36, 38, 40].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={!isSubscriber || isPending}
                        onClick={() => setScoreValue(preset)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                          scoreValue === preset
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                            : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                  <Label htmlFor="playedOn" className="text-xs font-medium text-slate-300">
                    Date Played
                  </Label>
                  <Input
                    id="playedOn"
                    type="date"
                    max={todayStr}
                    value={playedOn}
                    disabled={!isSubscriber || isPending}
                    onChange={(e) => setPlayedOn(e.target.value)}
                    className="bg-slate-950 border-slate-800 font-mono"
                    required
                  />
                </div>

                {/* Duplicate Date Warning */}
                {duplicateScore && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-200">Score Already Exists on Date</p>
                      <p className="mt-0.5 text-amber-400/90">
                        You recorded <span className="font-bold">{duplicateScore.score} pts</span>{" "}
                        for this date. Digital Heroes allows 1 score per date. Submitting will
                        overwrite or you can edit below.
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!isSubscriber || isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
                >
                  {isPending ? "Recording Round..." : "Record Score"}
                </Button>

                {/* 5-Score Window Explainer */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rolling 5 Window:</strong> Only your 5 most recent rounds are retained.
                    When adding a 6th round, the oldest stored round is automatically replaced.
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Retained Scores List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Your Latest 5 Scores</h3>
              <p className="text-xs text-slate-400">
                Sorted in reverse chronological order (newest to oldest).
              </p>
            </div>
            <Badge variant="outline" className="border-slate-800 text-slate-400 text-xs font-mono">
              {scoreCount} / 5 Slots
            </Badge>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((slotIdx) => {
              const score = scores[slotIdx - 1];
              return (
                <ScoreSlot
                  key={score ? score.id : `empty-slot-${slotIdx}`}
                  slotNumber={slotIdx}
                  score={score}
                  isLatest={slotIdx === 1 && !!score}
                  onEdit={isSubscriber ? handleStartEdit : undefined}
                  onDelete={isSubscriber ? (s) => setDeletingScore(s) : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Score Modal */}
      {editingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Edit Golf Score</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingScore(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editScore" className="text-xs font-medium text-slate-300">
                  Stableford Score (1–45)
                </Label>
                <Input
                  id="editScore"
                  type="number"
                  min={1}
                  max={45}
                  value={editScoreValue}
                  onChange={(e) => setEditScoreValue(Number(e.target.value))}
                  className="bg-slate-950 border-slate-800 font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPlayedOn" className="text-xs font-medium text-slate-300">
                  Date Played
                </Label>
                <Input
                  id="editPlayedOn"
                  type="date"
                  max={todayStr}
                  value={editPlayedOn}
                  onChange={(e) => setEditPlayedOn(e.target.value)}
                  className="bg-slate-950 border-slate-800 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingScore(null)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-950/50 border border-rose-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Score Entry</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete the score of{" "}
              <strong className="text-white">{deletingScore.score} pts</strong> recorded for{" "}
              <strong className="text-white">{deletingScore.played_on}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingScore(null)}
                className="border-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
