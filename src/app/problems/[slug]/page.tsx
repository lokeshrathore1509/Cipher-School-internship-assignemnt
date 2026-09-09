import Link from "next/link";
import { notFound } from "next/navigation";
import { problemService } from "@/application/services/ProblemService";
import { DifficultyBadge, StatusBadge } from "@/components/ui/Badge";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Code2,
  FileText,
  History,
  Info,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await problemService.getProblemBySlug(slug);

  if (!data || !data.problem) {
    notFound();
  }

  const { problem, attempts } = data;
  const completedAttempts = attempts.filter(
    (a) => a.status === "COMPLETED" && a.evaluation
  );

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/problems" className="hover:text-blue-400 transition">
              Problems
            </Link>
            <span>/</span>
            <span className="text-slate-200">{problem.slug}</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {problem.title}
            </h1>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/problems/${problem.slug}/practice`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" />
            {attempts.length > 0 ? "Practice Again (New Attempt)" : "Start Practice"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Problem Specification on Left, Previous Attempts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Full Problem Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Problem Statement Card */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-card space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              Problem Statement
            </h2>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {problem.problemStatement}
            </p>
          </div>

          {/* Functional Requirements */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Functional Requirements
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {problem.functionalRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="h-5 w-5 rounded-full bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Assumptions & Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl border border-slate-800 bg-card space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-400" />
                Domain Assumptions
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {problem.assumptions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-card space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                System Constraints
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {problem.constraints.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Expected Design Areas & Edge Cases */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              Expected Design Areas & Patterns
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              {problem.expectedDesignAreas.map((area, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="font-bold text-slate-200">{area.split(":")[0]}</div>
                  <div className="text-slate-400">{area.split(":").slice(1).join(":")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Edge Cases */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-card space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="h-4 w-4 text-rose-400" />
              Sample Edge Cases to Handle
            </h2>
            <ul className="space-y-2 text-xs text-slate-300">
              {problem.sampleEdgeCases.map((ec, i) => (
                <li key={i} className="flex items-start gap-2 p-2 rounded bg-slate-900/40 border border-slate-800/50">
                  <span className="text-rose-400 font-bold shrink-0">⚠</span>
                  <span>{ec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Practice History & Score Progression Loop */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-card space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-400" />
                Your Previous Attempts
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {attempts.length} total
              </span>
            </div>

            {/* Score Progression indicator */}
            {completedAttempts.length > 1 && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Score Progression
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {completedAttempts.map((ca, idx) => (
                    <div key={ca.id} className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        #{ca.attemptNumber}:{" "}
                        <strong className="text-white">
                          {ca.evaluation?.overallScore}%
                        </strong>
                      </span>
                      {idx < completedAttempts.length - 1 && (
                        <span className="text-slate-600">&rarr;</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attempts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                <p>No attempts recorded yet for this problem.</p>
                <p className="text-slate-400">
                  Click below to begin your first design attempt.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          Attempt #{attempt.attemptNumber}
                        </span>
                        <StatusBadge status={attempt.status} />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(attempt.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      {attempt.evaluation ? (
                        <div className="font-black text-emerald-400 text-sm">
                          {attempt.evaluation.overallScore}%
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">—</div>
                      )}
                      <Link
                        href={
                          attempt.status === "COMPLETED" || attempt.status === "FAILED"
                            ? `/attempts/${attempt.id}`
                            : `/problems/${problem.slug}/practice`
                        }
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 block"
                      >
                        {attempt.status === "COMPLETED"
                          ? "View Feedback &rarr;"
                          : attempt.status === "FAILED"
                          ? "Retry Evaluation &rarr;"
                          : "Resume Draft &rarr;"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/problems/${problem.slug}/practice`}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {attempts.length > 0 ? "Start New Attempt" : "Start First Attempt"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
