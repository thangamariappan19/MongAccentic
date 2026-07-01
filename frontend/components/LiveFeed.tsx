"use client";
import { useEffect, useRef, useState } from "react";
import { createLiveSocket, type LiveEvent } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

const MAX = 6;

export default function LiveFeed() {
  const [events, setEvents]       = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      const ws = createLiveSocket((ev) => {
        if (ev.type === "ping") return;
        setEvents((prev) => [ev, ...prev].slice(0, MAX));
      });
      ws.onopen  = () => setConnected(true);
      ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    }
    connect();
    return () => wsRef.current?.close();
  }, []);

  return (
    <div className="surface rounded-xl overflow-hidden flex flex-col h-full min-h-[240px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? "bg-emerald-500" : "bg-[#334155]"}`} />
        </span>
        <span className="text-xs font-medium text-[#64748b]">
          {connected ? "Live" : "Connecting…"}
        </span>
      </div>

      {/* Events */}
      <div className="flex-1 divide-y divide-white/[0.03] overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-xs text-[#334155]">
            Waiting for events…
          </div>
        ) : events.map((ev, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs text-emerald-500 font-medium">{ev.claim_id}</span>
              {ev.status && <StatusBadge status={ev.status} />}
              {ev.ring_detected && (
                <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-medium">
                  Ring
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <span className="truncate">{ev.claimant_name}</span>
              {ev.amount != null && <span>${ev.amount.toLocaleString()}</span>}
              {ev.fraud_score != null && (
                <span className={ev.fraud_score >= 70 ? "text-red-400" : ev.fraud_score >= 40 ? "text-amber-400" : "text-emerald-500"}>
                  fraud {ev.fraud_score}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
