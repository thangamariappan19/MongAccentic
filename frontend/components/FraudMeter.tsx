export default function FraudMeter({ score, compact = false }: { score: number; compact?: boolean }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? "#ef4444" : pct >= 40 ? "#f59e0b" : "#22c55e";
  const label = pct >= 70 ? "HIGH" : pct >= 40 ? "MEDIUM" : "LOW";

  if (compact) {
    return (
      <div className="flex items-center gap-2 justify-center">
        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-xs font-mono" style={{ color }}>{pct}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Fraud Score</span>
        <span className="font-bold text-lg" style={{ color }}>{pct}<span className="text-xs text-gray-500">/100</span></span>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Clean</span>
        <span className="font-semibold" style={{ color }}>{label} RISK</span>
        <span>Fraud</span>
      </div>
    </div>
  );
}
