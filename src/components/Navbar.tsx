import Link from "next/link";
import { Layers, BookOpen, History, Cpu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white hover:opacity-90 transition">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="tracking-tight font-extrabold text-white text-base">LLD Forge</span>
            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold -mt-1">
              Practice Platform
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition"
          >
            Dashboard
          </Link>
          <Link
            href="/problems"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition"
          >
            <BookOpen className="h-4 w-4 text-blue-400" />
            Problems
          </Link>
          <Link
            href="/attempts"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition"
          >
            <History className="h-4 w-4 text-emerald-400" />
            Attempt History
          </Link>
        </nav>

        {/* Evaluation Engine Badge */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-300">
          <Cpu className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          <span>Rubric Evaluator</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>
      </div>
    </header>
  );
}
