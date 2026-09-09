import React from "react";

export function ScoreGauge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  let color = "text-emerald-400";
  let ringColor = "stroke-emerald-500";
  let bgColor = "bg-emerald-950/40 border-emerald-800/60";

  if (score < 60) {
    color = "text-rose-400";
    ringColor = "stroke-rose-500";
    bgColor = "bg-rose-950/40 border-rose-800/60";
  } else if (score < 80) {
    color = "text-amber-400";
    ringColor = "stroke-amber-500";
    bgColor = "bg-amber-950/40 border-amber-800/60";
  }

  const dimensions = {
    sm: { width: 48, stroke: 4, text: "text-sm", label: "text-[10px]" },
    md: { width: 80, stroke: 6, text: "text-2xl", label: "text-xs" },
    lg: { width: 110, stroke: 8, text: "text-4xl", label: "text-sm" },
  }[size];

  const radius = (dimensions.width - dimensions.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="-rotate-90"
        width={dimensions.width}
        height={dimensions.width}
      >
        <circle
          className="stroke-slate-800"
          strokeWidth={dimensions.stroke}
          fill="transparent"
          r={radius}
          cx={dimensions.width / 2}
          cy={dimensions.width / 2}
        />
        <circle
          className={`${ringColor} transition-all duration-700 ease-out`}
          strokeWidth={dimensions.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={dimensions.width / 2}
          cy={dimensions.width / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-black ${color} ${dimensions.text} tracking-tighter leading-none`}>
          {score}
        </span>
        <span className="text-[9px] text-slate-400 uppercase font-semibold">/100</span>
      </div>
    </div>
  );
}

export function CriterionScoreBar({ score }: { score: number }) {
  let color = "bg-emerald-500";
  let text = "text-emerald-400";

  if (score <= 2) {
    color = "bg-rose-500";
    text = "text-rose-400";
  } else if (score === 3) {
    color = "bg-amber-500";
    text = "text-amber-400";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2.5 w-4 rounded-sm transition ${
              i <= score ? color : "bg-slate-800 border border-slate-700"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-bold ${text}`}>{score} / 5</span>
    </div>
  );
}
