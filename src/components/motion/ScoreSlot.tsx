"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Edit3, Trash2, Trophy, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GolfScore } from "@/modules/scores/service";

interface ScoreSlotProps {
  slotNumber: number;
  score?: GolfScore;
  isLatest?: boolean;
  onEdit?: (score: GolfScore) => void;
  onDelete?: (score: GolfScore) => void;
}

export function ScoreSlot({
  slotNumber,
  score,
  isLatest = false,
  onEdit,
  onDelete,
}: ScoreSlotProps) {
  if (!score) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: slotNumber * 0.05 }}
        className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 backdrop-blur-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-500 font-mono text-sm font-semibold">
            #{slotNumber}
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-400">Empty Round Slot</h4>
            <p className="text-xs text-slate-500">
              Log a round to fill this slot for monthly draw eligibility
            </p>
          </div>
        </div>
        <div className="mt-3 sm:mt-0">
          <Badge variant="outline" className="border-slate-800 text-slate-500 text-xs">
            Awaiting Round
          </Badge>
        </div>
      </motion.div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(score.played_on));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: slotNumber * 0.05 }}
      whileHover={{ y: -2 }}
      className={`relative flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all ${
        isLatest
          ? "bg-gradient-to-r from-emerald-950/30 via-slate-900/70 to-slate-900/70 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
            isLatest
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}
        >
          {score.score}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-400">
              Slot #{slotNumber}
            </span>
            {isLatest && (
              <Badge variant="active" className="text-[10px] py-0 px-2 uppercase tracking-wider font-semibold">
                Latest Round
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] py-0 px-2 bg-slate-800 text-slate-300">
              Stableford
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 sm:mt-0 flex items-center gap-2 self-end sm:self-auto">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(score)}
            className="text-slate-400 hover:text-white hover:bg-slate-800/80 h-8 px-3 rounded-lg"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(score)}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 h-8 px-3 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        )}
      </div>
    </motion.div>
  );
}
