export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/40 py-6 text-center text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-400">
          LLD Practice Platform &copy; {new Date().getFullYear()} — Built for rigorous Low-Level Object-Oriented Design Mastery.
        </p>
        <div className="flex items-center gap-4 text-slate-400">
          <span>8-Dimension Explainable Rubric</span>
          <span>•</span>
          <span>Pluggable Evaluators</span>
          <span>•</span>
          <span>Modular Monolith</span>
        </div>
      </div>
    </footer>
  );
}
