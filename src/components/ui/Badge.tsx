import React from "react";

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const normalized = difficulty.toUpperCase();
  let color = "bg-slate-800 text-slate-300 border-slate-700";

  if (normalized === "EASY") {
    color = "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
  } else if (normalized === "MEDIUM") {
    color = "bg-amber-950/60 text-amber-400 border-amber-800/60";
  } else if (normalized === "HARD") {
    color = "bg-rose-950/60 text-rose-400 border-rose-800/60";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      {normalized}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();

  switch (s) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Completed
        </span>
      );
    case "EVALUATING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/70 text-blue-300 border border-blue-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span>
          Evaluating...
        </span>
      );
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
          Submitted
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
          Failed
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
          Draft
        </span>
      );
  }
}

export function EvaluatorBadge({ type }: { type: string }) {
  if (type === "AI") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/70 text-purple-300 border border-purple-800/80">
        <span>✨</span> AI Evaluator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-blue-300 border border-slate-700">
      <span>📐</span> Rule-Based Evaluator
    </span>
  );
}
