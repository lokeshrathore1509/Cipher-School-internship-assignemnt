"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AttemptEntity, CriterionResult, EvaluatorType } from "@/domain/types";
import { RUBRIC_DIMENSIONS } from "@/domain/rubric/rubric.definition";
import { EvaluatorBadge, StatusBadge } from "@/components/ui/Badge";
import { CriterionScoreBar, ScoreGauge } from "@/components/ui/ScoreGauge";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileCode,
  Layers,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface AttemptReviewProps {
  attempt: AttemptEntity;
}

export default function AttemptReview({ attempt }: AttemptReviewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"feedback" | "solution">("feedback");
  const [isRetrying, setIsRetrying] = useState(false);
  const [isReEvaluating, setIsReEvaluating] = useState(false);
  const [evaluatorType, setEvaluatorType] = useState<EvaluatorType>(
    attempt.evaluation?.evaluatorType || "RULE_BASED"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const evaluation = attempt.evaluation;
  const submission = attempt.submission;
  const problem = attempt.problem;

  // Handle "Try Again" flow: Creates a brand new attempt while keeping this one immutable
  const handleTryAgain = async () => {
    if (!problem?.slug) return;
    setIsRetrying(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problem.slug,
          isRetry: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create new attempt.");
      }

      // Navigate to practice workspace for the new attempt
      router.push(`/problems/${problem.slug}/practice`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate retry attempt.");
      setIsRetrying(false);
    }
  };

  // Re-run evaluation (if FAILED or switching between Rule-Based and AI)
  const handleReEvaluate = async () => {
    setIsReEvaluating(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/attempts/${attempt.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluatorType }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Evaluation failed.");
      }

      // Refresh page to show updated evaluation
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to run evaluation.");
      setIsReEvaluating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/attempts" className="hover:text-blue-400 transition">
              Attempts
            </Link>
            <span>/</span>
            <span className="text-slate-200">Attempt #{attempt.attemptNumber}</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {problem?.title || "Attempt Evaluation"}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Attempt #{attempt.attemptNumber}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/problems/${problem?.slug}`}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Problem Overview
          </Link>
          <button
            onClick={handleTryAgain}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isRetrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Try Again (New Attempt)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        </div>
      )}

      {/* If evaluation is FAILED */}
      {attempt.status === "FAILED" && (
        <div className="p-6 rounded-2xl border border-rose-800/80 bg-rose-950/30 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-lg font-bold">Evaluation Incomplete</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The previous evaluation attempt encountered an error. Your submitted solution has been safely preserved.
            You can re-trigger evaluation below using either the deterministic rule-based engine or AI evaluator.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <select
              value={evaluatorType}
              onChange={(e) => setEvaluatorType(e.target.value as EvaluatorType)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2"
            >
              <option value="RULE_BASED">Rule-Based Evaluator</option>
              <option value="AI">AI Evaluator (Requires OPENAI_API_KEY)</option>
            </select>
            <button
              onClick={handleReEvaluate}
              disabled={isReEvaluating}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-md transition"
            >
              {isReEvaluating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Retry Evaluation
            </button>
          </div>
        </div>
      )}

      {/* Main Feedback & Review Display */}
      {evaluation && (
        <>
          {/* Executive Summary Card */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-card shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={attempt.status} />
                <EvaluatorBadge type={evaluation.evaluatorType} />
                <span className="text-xs text-slate-500">
                  Evaluated on {new Date(evaluation.createdAt).toLocaleString()}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Architectural Assessment
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {evaluation.summary}
              </p>
            </div>

            {/* Score Ring Gauge */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex flex-col items-center justify-center shrink-0 min-w-[140px]">
              <ScoreGauge score={evaluation.overallScore} size="lg" />
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                Overall Score
              </div>
            </div>
          </div>

          {/* Top Strengths & Improvement Areas Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Strengths */}
            <div className="p-6 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Key Architectural Strengths</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {evaluation.topStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="h-4 w-4 rounded-full bg-emerald-900/80 text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Improvement Areas */}
            <div className="p-6 rounded-2xl border border-amber-900/60 bg-amber-950/20 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Priority Improvement Opportunities</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {evaluation.topImprovements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="h-4 w-4 rounded-full bg-amber-900/80 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      !
                    </span>
                    <span className="leading-relaxed">{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tab Navigation: Rubric Feedback vs Submitted Solution */}
          <div className="flex items-center gap-2 border-b border-slate-800">
            <button
              onClick={() => setActiveTab("feedback")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === "feedback"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-4 w-4" />
              8-Dimension Rubric Breakdown ({evaluation.criteria.length})
            </button>
            <button
              onClick={() => setActiveTab("solution")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === "solution"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <FileCode className="h-4 w-4" />
              View Submitted Design
            </button>
          </div>

          {/* TAB 1: 8 Criterion Cards */}
          {activeTab === "feedback" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {evaluation.criteria.map((criterion, idx) => {
                const meta = RUBRIC_DIMENSIONS[criterion.dimension];
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border border-slate-800 bg-card space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header with Title & Score Bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                            Dimension 0{idx + 1}
                          </span>
                          <h3 className="text-base font-bold text-white">
                            {meta?.label || criterion.dimension}
                          </h3>
                        </div>
                        <CriterionScoreBar score={criterion.score} />
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {meta?.description}
                      </p>

                      {/* Evidence Block */}
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                          <span>🔍</span> Evidence from Submission:
                        </div>
                        <p className="text-xs text-slate-200 italic leading-relaxed">
                          "{criterion.evidence}"
                        </p>
                      </div>

                      {/* Architectural Concern */}
                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-1">
                        <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Architectural Concern:
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {criterion.concern}
                        </p>
                      </div>

                      {/* Actionable Suggestion */}
                      <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 space-y-1">
                        <div className="text-[11px] font-bold text-blue-400 uppercase flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Actionable Suggestion:
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {criterion.suggestion}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Evaluator Confidence:</span>
                      <span className="font-semibold text-slate-400">
                        {criterion.confidence || "HIGH"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Submitted Design Inspector */}
          {activeTab === "solution" && submission && (
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-card space-y-6">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Submitted Design Payload</h3>
                  <p className="text-xs text-slate-400">
                    Timestamp: {new Date(submission.createdAt).toLocaleString()} • Format: {submission.format}
                  </p>
                </div>
              </div>

              <div className="space-y-5 text-xs text-slate-300">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    A. Requirements Understanding
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {submission.content.requirementsUnderstanding}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    B. Assumptions
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {submission.content.assumptions}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    C. Core Classes & Interfaces
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap font-mono">
                    {submission.content.coreClasses}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    D. Responsibilities (SRP)
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {submission.content.responsibilities}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    E. Relationships (Composition vs Inheritance)
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {submission.content.relationships}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    F. Important Methods & Contracts
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap font-mono">
                    {submission.content.importantMethods}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    G. Design Patterns & Abstractions
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {submission.content.designPatterns}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    H. Edge Cases & Concurrency
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {submission.content.edgeCases}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    I. Trade-offs & Design Decisions
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                    {submission.content.tradeOffs}
                  </div>
                </div>

                {submission.content.solutionNotes && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                      Additional Solution Notes
                    </h4>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                      {submission.content.solutionNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Call to Action for Deliberate Practice Loop */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">Apply Feedback in a New Attempt</h4>
              <p className="text-xs text-slate-400">
                The essence of mastery is iteration. Refine your abstractions and try again to improve your score.
              </p>
            </div>

            <button
              onClick={handleTryAgain}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 shrink-0"
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Start Attempt #{attempt.attemptNumber + 1}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
