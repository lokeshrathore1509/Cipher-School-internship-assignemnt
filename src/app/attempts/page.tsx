import Link from "next/link";
import { attemptRepository } from "@/infrastructure/repositories/AttemptRepository";
import { EvaluatorBadge, StatusBadge } from "@/components/ui/Badge";
import { ArrowRight, BookOpen, Clock, Code2, History, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AttemptsHistoryPage() {
  const attempts = await attemptRepository.findAll(100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <History className="h-4 w-4" />
            Learning Log
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Attempt History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review your past design submissions, evaluations, and score progression.
          </p>
        </div>

        <Link
          href="/problems"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition shrink-0"
        >
          <BookOpen className="h-4 w-4" />
          Browse Problems
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-card/40 space-y-3">
          <Code2 className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No attempts logged yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose a problem from the library to start designing and submit for rubric evaluation.
          </p>
          <div className="pt-2">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              Choose a Problem
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-card overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-5 font-semibold">Problem</th>
                  <th className="py-4 px-5 font-semibold">Attempt</th>
                  <th className="py-4 px-5 font-semibold">Status</th>
                  <th className="py-4 px-5 font-semibold">Score</th>
                  <th className="py-4 px-5 font-semibold">Evaluator</th>
                  <th className="py-4 px-5 font-semibold">Date</th>
                  <th className="py-4 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="hover:bg-slate-900/40 transition duration-150"
                  >
                    <td className="py-4 px-5 font-medium text-white">
                      <Link
                        href={`/problems/${attempt.problem?.slug}`}
                        className="hover:text-blue-400 transition"
                      >
                        {attempt.problem?.title || "Unknown Problem"}
                      </Link>
                    </td>
                    <td className="py-4 px-5 text-slate-300">
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        Attempt #{attempt.attemptNumber}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={attempt.status} />
                    </td>
                    <td className="py-4 px-5">
                      {attempt.evaluation?.overallScore !== undefined ? (
                        <span
                          className={`font-black text-sm ${
                            attempt.evaluation.overallScore >= 80
                              ? "text-emerald-400"
                              : attempt.evaluation.overallScore >= 60
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {attempt.evaluation.overallScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {attempt.evaluation?.evaluatorType ? (
                        <EvaluatorBadge type={attempt.evaluation.evaluatorType} />
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-400">
                      {new Date(attempt.createdAt).toLocaleDateString()}{" "}
                      <span className="text-[11px] text-slate-500">
                        {new Date(attempt.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={
                          attempt.status === "COMPLETED" || attempt.status === "FAILED"
                            ? `/attempts/${attempt.id}`
                            : `/problems/${attempt.problem?.slug}/practice`
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        {attempt.status === "COMPLETED"
                          ? "View Evaluation"
                          : attempt.status === "FAILED"
                          ? "Retry Evaluation"
                          : "Resume Draft"}
                        <ArrowRight className="h-3.5 w-3.5" />
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
  );
}
