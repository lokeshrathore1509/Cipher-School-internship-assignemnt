import Link from "next/link";
import { problemService } from "@/application/services/ProblemService";
import { DifficultyBadge, StatusBadge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await problemService.getDashboardData();
  const { metrics, recentAttempts, problems } = data;

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 p-8 sm:p-10 shadow-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/60">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Deliberate LLD Practice Loop</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Stop guessing your Low-Level Design quality.
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Practice classic object-oriented system designs with structured evidence.
            Receive deep, explainable rubric feedback on class responsibilities,
            coupling, extensibility, and design patterns.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <BookOpen className="h-4 w-4" />
              Explore Problem Library
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/attempts"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Clock className="h-4 w-4 text-emerald-400" />
              View Attempt History
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-xl border border-slate-800 bg-card/60 backdrop-blur-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {metrics.problemsPracticed} <span className="text-sm font-medium text-slate-400">/ 4</span>
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Problems Practiced
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-card/60 backdrop-blur-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {metrics.totalAttempts}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Attempts Made
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-card/60 backdrop-blur-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">
              {metrics.averageScore > 0 ? `${metrics.averageScore}%` : "—"}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Average Evaluation Score
            </div>
          </div>
        </div>
      </div>

      {/* Continue Practicing Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-400" />
              Practice Library
            </h2>
            <p className="text-xs text-slate-400">
              Select an object-oriented system design challenge to practice your low-level design.
            </p>
          </div>
          <Link
            href="/problems"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View all 4 problems &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className="p-6 rounded-xl border border-slate-800 bg-card hover:border-slate-700 transition duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.bestScore !== null ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Best: {problem.bestScore}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Unattempted</span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                  <Link href={`/problems/${problem.slug}`}>
                    {problem.title}
                  </Link>
                </h3>

                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {problem.shortDescription}
                </p>

                {/* Key focus tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {problem.expectedDesignAreas.slice(0, 3).map((area, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                    >
                      {area.split(":")[0]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {problem.attemptCount > 0 ? (
                    <span>
                      {problem.attemptCount} attempt{problem.attemptCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span>Not started yet</span>
                  )}
                </div>

                <Link
                  href={`/problems/${problem.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 group-hover:translate-x-0.5 transition"
                >
                  Start Practice
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attempts & Progress Loop */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Recent Practice Attempts
            </h2>
            <p className="text-xs text-slate-400">
              Track your iterative progress across attempts.
            </p>
          </div>
          <Link
            href="/attempts"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            Full history &rarr;
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-card/30">
            <Code2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No attempts yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Select any of the 4 LLD problems above to design your solution and receive rubric feedback.
            </p>
            <Link
              href="/problems"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
            >
              Start Your First Attempt
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Problem</th>
                    <th className="py-3.5 px-4 font-semibold">Attempt</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Score</th>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {attempt.problem?.title || "Unknown Problem"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          Attempt #{attempt.attemptNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={attempt.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {attempt.evaluation?.overallScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-sm ${
                                attempt.evaluation.overallScore >= 80
                                  ? "text-emerald-400"
                                  : attempt.evaluation.overallScore >= 60
                                  ? "text-amber-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {attempt.evaluation.overallScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={
                            attempt.status === "COMPLETED" || attempt.status === "FAILED"
                              ? `/attempts/${attempt.id}`
                              : `/problems/${attempt.problem?.slug}/practice`
                          }
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                        >
                          {attempt.status === "COMPLETED"
                            ? "View Feedback"
                            : attempt.status === "FAILED"
                            ? "Review & Retry"
                            : "Continue"}
                          &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* How the Evaluation Loop Works info card */}
      <div className="p-6 sm:p-8 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          The LLD Evaluation Standard
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-card/60 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">01. Responsibilities</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Detection of God Classes and SRP violations. Evaluates if classes have single reasons to change.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card/60 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">02. Abstractions</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Assesses whether Strategy, State, or Factory patterns are applied purposefully without over-engineering.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card/60 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">03. Extensibility</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tests the Open-Closed Principle: can new features be added without altering existing working classes?
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card/60 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">04. Concurrency & Edges</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Checks race condition safety, lock granularity, resource exhaustion, and failure recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
