import Link from "next/link";
import type { FraudRing } from "@/lib/api";

export default function FraudRingGraph({ ring }: { ring: FraudRing }) {
  const riskColor = ring.risk_score >= 70 ? "#ef4444" : ring.risk_score >= 40 ? "#f59e0b" : "#22c55e";

  return (
    <div className="bg-red-950/20 border border-red-500/40 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-lg">⚠️</span>
          <div>
            <div className="font-bold text-red-300 text-sm">FRAUD RING DETECTED</div>
            <div className="text-xs text-red-400/70 font-mono">{ring.ring_id}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: riskColor }}>{ring.risk_score}</div>
          <div className="text-xs text-gray-500">ring score</div>
        </div>
      </div>

      {/* Ring signals */}
      <div className="space-y-1">
        {ring.signals.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-red-300/80">
            <span className="text-red-500 mt-0.5 shrink-0">•</span>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* Connected claims graph */}
      <div>
        <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Connected Claims ({ring.claim_ids.length})</div>
        <div className="flex flex-col gap-2">
          {ring.claim_ids.map((cid, i) => (
            <div key={cid} className="flex items-center gap-3">
              {i > 0 && (
                <div className="ml-4 w-px h-4 bg-red-500/40 -mt-2 mb-1 absolute" />
              )}
              <Link href={`/claims/${cid}`}
                className="flex items-center gap-3 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 rounded-lg px-3 py-2 transition-colors w-full">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="font-mono text-red-300 text-sm font-medium">{cid}</span>
                <span className="text-gray-500 text-xs ml-auto">View →</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-600 border-t border-gray-800 pt-3">
        Detected {new Date(ring.detected_at).toLocaleDateString("en-IN")} ·
        Claim type: <span className="capitalize text-gray-500">{ring.claim_type.replace("_", " ")}</span>
      </div>
    </div>
  );
}
