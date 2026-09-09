import Link from "next/link";
import { problemService } from "@/application/services/ProblemService";
import { DifficultyBadge } from "@/components/ui/Badge";
import { ArrowRight, BookOpen, CheckCircle, Code, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const problems = await problemService.getAllProblems();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
          <BookOpen className="h-4 w-4" />
          Curated Problem Library
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Low-Level Design Challenges
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Master the art of object-oriented design. Each problem is designed to test your ability to model
          real-world domains, isolate changing requirements with patterns, and articulate clean trade-offs.
        </p>
      </div>

      {/* Problem Cards List */}
      <div className="grid grid-cols-1 gap-6">
        {problems.map((problem) => (
          <div
            key={problem.id}
            className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-card hover:border-slate-700 transition duration-200 shadow-sm flex flex-col md:flex-row justify-between gap-6 group"
          >
            {/* Left side info */}
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <DifficultyBadge difficulty={problem.difficulty} />
                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
                  <Link href={`/problems/${problem.slug}`}>
                    {problem.title}
                  </Link>
                </h2>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {problem.shortDescription}
              </p>

              {/* Functional requirements pill highlights */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Core Functional Invariants:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                  {problem.functionalRequirements.slice(0, 4).map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Design area tags */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Focus Areas:</span>
                {problem.expectedDesignAreas.map((area, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    {area.split(":")[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Right side stats & CTA */}
            <div className="flex md:flex-col justify-between md:justify-center items-end border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-8 min-w-[200px] shrink-0 gap-4">
              <div className="text-left md:text-right space-y-1">
                <div className="text-xs text-slate-400">
                  {problem.attemptCount > 0 ? (
                    <span className="font-semibold text-slate-200">
                      {problem.attemptCount} Attempt{problem.attemptCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span>Not attempted yet</span>
                  )}
                </div>
                {problem.bestScore !== null ? (
                  <div className="text-sm font-bold text-emerald-400">
                    Best: {problem.bestScore}%
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No score yet</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/problems/${problem.slug}`}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  View Details
                </Link>
                <Link
                  href={`/problems/${problem.slug}/practice`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition"
                >
                  Start Practice
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
