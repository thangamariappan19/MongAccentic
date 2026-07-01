"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchClaims, type ClaimListItem } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import RoleBar from "@/components/RoleBar";

const FILTERS = [
  { label: "All",          value: "" },
  { label: "Approved",     value: "approved" },
  { label: "Flagged",      value: "flagged" },
  { label: "Escalated",    value: "escalated" },
  { label: "Pending Docs", value: "pending_docs" },
];

const PAGE_SIZE = 10;

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchClaims(filter || undefined).then(setClaims).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { setPage(0); }, [filter, search]);

  const visible = search
    ? claims.filter((c) =>
        c.claim_id.toLowerCase().includes(search.toLowerCase()) ||
        c.claimant_name.toLowerCase().includes(search.toLowerCase())
      )
    : claims;

  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const paginated  = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const from       = visible.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to         = Math.min((page + 1) * PAGE_SIZE, visible.length);

  return (
    <div className="space-y-6">
      <RoleBar />

      {/* Chapter card */}
      <div className="rounded-xl px-5 py-4" style={{ background: "#0a0d12", border: "1px solid #A100FF20" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#A100FF15", color: "#A100FF", border: "1px solid #A100FF30" }}>
            Chapter 3 · AI Decisions
          </span>
        </div>
        <h1 className="text-base font-bold text-white">Every row = one AI decision, made in under 3 seconds</h1>
        <p className="text-xs text-[#475569] mt-1 mb-3 leading-relaxed">
          No human reviewed these claims first. Each was processed by 5 agents — policy match, fraud analysis, ring detection, risk assessment, and final verdict.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { color: "#10b981", label: "APPROVED", desc: "Verified — payment authorized" },
            { color: "#ef4444", label: "FLAGGED",  desc: "Fraud signals detected — held" },
            { color: "#A100FF", label: "ESCALATED",desc: "Senior adjuster required" },
            { color: "#f59e0b", label: "PENDING",  desc: "More documents needed" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="font-bold" style={{ color: s.color }}>{s.label}</span>
              <span className="text-[#334155]">— {s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">All Claims</h2>
          <p className="text-sm text-[#64748b] mt-0.5">
            {loading ? "Loading…" : visible.length > 0 ? `${visible.length} claims processed by AI` : "No claims found"}
          </p>
        </div>
        <Link href="/submit" className="btn-primary">+ New Claim</Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID or name…"
            className="surface rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#334155] focus:outline-none w-full sm:w-56"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filter === f.value
                  ? "border-[#A100FF]/40 bg-[#A100FF]/10 text-[#b84dff]"
                  : "border-white/[0.06] bg-transparent text-[#64748b] hover:text-white hover:border-white/[0.1]"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="surface rounded-xl overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="animate-pulse divide-y divide-white/[0.03]">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-3.5">
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="h-3 w-32 rounded bg-white/[0.04]" />
                <div className="h-3 w-16 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Claim ID</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Claimant</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Fraud</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Status</th>
                <th className="hidden sm:table-cell px-5 py-3 text-left text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Date</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {paginated.map((c) => (
                <tr key={c.claim_id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3.5 font-mono text-xs text-[#A100FF] font-medium">{c.claim_id}</td>
                  <td className="px-5 py-3.5 text-[#e2e8f0] font-medium">{c.claimant_name}</td>
                  <td className="px-5 py-3.5 text-[#64748b] text-xs capitalize">{c.claim_type.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3.5 text-right text-[#e2e8f0] font-semibold tabular-nums">${c.amount.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <FraudScore score={c.fraud_score ?? 0} />
                  </td>
                  <td className="px-5 py-3.5 text-center"><StatusBadge status={c.status} /></td>
                  <td className="hidden sm:table-cell px-5 py-3.5 text-xs text-[#334155] tabular-nums">
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/claims/${c.claim_id}`}
                      className="text-xs text-[#334155] group-hover:text-[#A100FF] transition-colors font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs text-[#334155]">
                    {search ? `No results for "${search}"` : "No claims found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#334155]">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs surface border border-white/[0.06] text-[#64748b] disabled:opacity-30 hover:text-white transition-colors">
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs surface border border-white/[0.06] text-[#64748b] disabled:opacity-30 hover:text-white transition-colors">
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.min(Math.max(page - 2, 0) + i, totalPages - 1);
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    pageNum === page
                      ? "bg-[#A100FF]/20 text-[#b84dff] border border-[#A100FF]/30"
                      : "surface border border-white/[0.06] text-[#64748b] hover:text-white"
                  }`}>
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs surface border border-white/[0.06] text-[#64748b] disabled:opacity-30 hover:text-white transition-colors">
              Next
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1.5 rounded-lg text-xs surface border border-white/[0.06] text-[#64748b] disabled:opacity-30 hover:text-white transition-colors">
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FraudScore({ score }: { score: number }) {
  const s = Math.min(100, score);
  const color = s >= 70 ? "text-red-400" : s >= 40 ? "text-amber-400" : "text-emerald-500";
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-10 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full"
          style={{ width: `${s}%`, background: s >= 70 ? "#ef4444" : s >= 40 ? "#f59e0b" : "#10b981" }} />
      </div>
      <span className={`text-xs font-mono tabular-nums w-5 text-right ${color}`}>{s}</span>
    </div>
  );
}
