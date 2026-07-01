"use client";
import { useEffect, useState } from "react";
import { fetchIrdaiBenchmark, type IrdaiBenchmark } from "@/lib/api";

function yoy(curr: number, prev: number) {
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return { pct: pct.toFixed(1), up: pct >= 0, abs: Math.abs(pct).toFixed(1) };
}

export default function BenchmarkPage() {
  const [data, setData]       = useState<IrdaiBenchmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [showCompare, setShowCompare] = useState(false);
  const [openUpdate, setOpenUpdate]   = useState<string | null>(null);

  useEffect(() => {
    fetchIrdaiBenchmark()
      .then(setData)
      .catch(() => setError("Could not load benchmark data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (error || !data) return (
    <div className="py-24 text-center text-sm text-[#475569]">{error || "No data available"}</div>
  );

  const { irdai, comparison, live_signal, cached_at, from_cache } = data;
  const portalOk  = live_signal?.portal_reachable;
  const proj      = irdai.projections_fy2526;
  const gc        = irdai.global_context;
  const updates   = irdai.regulatory_updates ?? [];
  const trend     = irdai.year_trend ?? [];
  const m         = irdai.market;

  const cachedDate = cached_at ? new Date(cached_at).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "—";

  const premiumYoy = m.prev_total_premium_usd_bn
    ? yoy(m.total_premium_usd_bn, m.prev_total_premium_usd_bn) : null;

  return (
    <div className="space-y-8 max-w-[1200px]">

      {/* Chapter card */}
      <div className="rounded-xl px-5 py-4" style={{ background: "#080d0a", border: "1px solid #10b98120" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }}>
            Chapter 6 · Proof of Impact
          </span>
        </div>
        <h1 className="text-base font-bold text-white">How we compare to the industry</h1>
        <p className="text-xs text-[#475569] mt-1 leading-relaxed max-w-2xl">
          IRDAI (Insurance Regulatory Authority of India) mandates insurers settle claims within 30 days. The industry average is 21 days.
          <span className="text-white font-medium"> Our AI processes each claim in under 3 seconds</span> — that is 600,000× faster.
          This page shows real IRDAI benchmark data from FY 2023–24, compared live against our platform.
        </p>
        <div className="flex flex-wrap gap-4 mt-3">
          {[
            { label: "IRDAI mandate", val: "30 days", color: "#f59e0b" },
            { label: "Industry avg", val: "21 days", color: "#ef4444" },
            { label: "MongAccentic", val: "<3 seconds", color: "#10b981" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-[#475569]">{s.label}:</span>
              <span className="font-bold" style={{ color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <h1 className="text-xl font-semibold text-white">Regulatory Intelligence</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {irdai.fiscal_year}
            </span>
            {proj && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                +{proj.fiscal_year}
              </span>
            )}
          </div>
          <p className="text-sm text-[#475569]">
            IRDAI public benchmarks · global context · live AI performance comparison
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg surface text-[11px]">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {portalOk && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${portalOk ? "bg-emerald-500" : "bg-[#334155]"}`} />
          </span>
          <span className="text-[#475569]">{portalOk ? "Live portal check" : "Cached data"}</span>
          <span className="text-[#2d3748]">·</span>
          <span className="text-[#334155]">{cachedDate}</span>
          {from_cache && <span className="ml-1 px-1 rounded text-[9px] bg-white/[0.04] text-[#334155]">cached</span>}
        </div>
      </div>

      {/* ── Source ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg surface text-[11px] border-l-2 border-sky-500/40">
        <svg className="w-3 h-3 shrink-0 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="text-[#475569]">
          Source:&nbsp;<span className="text-white font-medium">{irdai.source}</span>
          &nbsp;·&nbsp;
          <a href={irdai.report_url} target="_blank" rel="noreferrer"
            className="text-sky-400 hover:text-sky-300 transition-colors">{irdai.report_url}</a>
          {live_signal?.live_records && (
            <span className="ml-2 text-emerald-400">· data.gov.in records fetched live</span>
          )}
        </span>
      </div>

      {/* ── Us vs Manual Process ──────────────────────────────────────────── */}
      <section>
        <SectionHeader accent="emerald">MongAccentic vs Traditional Claims Processing</SectionHeader>
        <div className="surface rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#334155] uppercase tracking-wider w-1/3">Capability</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#ef4444] uppercase tracking-wider w-1/3">Traditional Insurer</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#10b981] uppercase tracking-wider w-1/3">MongAccentic AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {[
                { cap: "Claim Processing Time",     old: "21 days avg",               ours: "< 3 seconds",                       better: true },
                { cap: "Fraud Detection",           old: "Manual review, 2–4 weeks",  ours: "Automated, real-time score",         better: true },
                { cap: "Fraud Ring Detection",      old: "Rarely detected",            ours: "Auto-detected, 0 humans needed",    better: true },
                { cap: "Policy Matching",           old: "Manual document lookup",     ours: "MongoDB Vector Search (semantic)",   better: true },
                { cap: "Multi-language Claims",     old: "Requires translator",        ours: "AI language detection built-in",    better: true },
                { cap: "IRDAI Compliance",          old: "30-day mandate, often late", ours: "100% — settled in seconds",         better: true },
                { cap: "Audit Trail",               old: "Paper / spreadsheet",        ours: "Immutable MongoDB record",          better: true },
                { cap: "Human Override",            old: "Always manual",              ours: "Available, logged, traceable",      better: true },
              ].map(row => (
                <tr key={row.cap} className="hover:bg-white/[0.01]">
                  <td className="px-5 py-2.5 text-xs text-[#64748b] font-medium">{row.cap}</td>
                  <td className="px-5 py-2.5">
                    <span className="text-xs text-[#ef4444]/80 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-500/50 shrink-0" />
                      {row.old}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-xs text-[#10b981] flex items-center gap-1.5 font-medium">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {row.ours}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 4 KPI Cards ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader accent="sky">Market Snapshot · {irdai.fiscal_year}</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Market Size"       value={`$${m.total_premium_usd_bn}B`}             sub="annual premiums"
            badge={premiumYoy ? { text: `+${premiumYoy.abs}%`, up: premiumYoy.up } : undefined} />
          <KpiCard label="Market Growth"           value={`${m.market_growth_pct}%`}                 sub="YoY growth" accent="emerald"
            badge={m.prev_growth_pct ? { text: `was ${m.prev_growth_pct}%`, up: m.market_growth_pct >= m.prev_growth_pct } : undefined} />
          <KpiCard label="Insurance Penetration"   value={`${m.insurance_penetration_gdp_pct}%`}     sub="% of GDP"
            badge={gc ? { text: `global ${gc.global_penetration_pct}%`, up: false, neutral: true } : undefined} />
          <KpiCard label="Registered Insurers"     value={m.registered_insurers}                     sub="life · non-life · health" />
        </div>
      </section>

      {/* ── FY 2024-25 Projections Banner ──────────────────────────────────── */}
      {proj && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.04]">
          <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/25 shrink-0 mt-0.5">
            {proj.fiscal_year}
          </span>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-1">
            <div>
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Market Size</span>
              <div className="text-sm font-bold text-violet-300 tabular-nums mt-0.5">${proj.total_premium_usd_bn}B</div>
            </div>
            <div>
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Penetration</span>
              <div className="text-sm font-bold text-violet-300 tabular-nums mt-0.5">{proj.insurance_penetration_gdp_pct}%</div>
            </div>
            <div>
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Growth Est.</span>
              <div className="text-sm font-bold text-violet-300 tabular-nums mt-0.5">{proj.market_growth_pct}%</div>
            </div>
          </div>
          <span className="text-[10px] text-[#334155] shrink-0 mt-1 max-w-[180px] leading-relaxed text-right">{proj.note}</span>
        </div>
      )}

      {/* ── Trend Line Chart ────────────────────────────────────────────────── */}
      {trend.length > 0 && (
        <section>
          <SectionHeader accent="sky">Market Trajectory · 6-Year View</SectionHeader>
          <TrendLineChart trend={trend} currentYear={irdai.fiscal_year} />
        </section>
      )}

      {/* ── AI vs Industry (collapsible) ────────────────────────────────────── */}
      <section>
        <button
          onClick={() => setShowCompare((v) => !v)}
          className="w-full flex items-center justify-between gap-3 mb-3 group"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#A100FF]" />
            <h2 className="text-[10px] font-semibold text-[#475569] uppercase tracking-[0.1em]">
              AI Platform vs Industry Benchmarks
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!showCompare && (
              <div className="hidden sm:flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400 font-medium">↑ {comparison.processing.improvement_label}</span>
                <span className="text-[#b84dff] font-medium">Real-time fraud scoring</span>
                <span className="text-emerald-400 font-medium">+{comparison.settlement.gap}pp settlement</span>
              </div>
            )}
            <svg className={`w-3.5 h-3.5 text-[#334155] transition-transform ${showCompare ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showCompare && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CompareCard title="Claim Processing Time"
              industryValue={comparison.processing.industry_label} industryDetail="industry average settlement"
              ourValue={comparison.processing.ours_label}         ourDetail="real-time AI pipeline"
              improvement={comparison.processing.improvement_label} note="IRDAI mandate is 30 days. Our AI settles in seconds." />
            <CompareCard title="Fraud Detection Speed"
              industryValue={`${comparison.fraud_detection.industry_detection_days}d avg`} industryDetail={comparison.fraud_detection.industry_method}
              ourValue="Real-time" ourDetail={`${comparison.fraud_detection.our_flagging_rate_pct}% of claims flagged`}
              improvement={`${comparison.fraud_detection.industry_estimate_pct}% est. industry fraud rate`} note="Every claim scored by AI before settlement." />
            <CompareCard title="Settlement Rate"
              industryValue={`${comparison.settlement.industry_pct}%`} industryDetail="non-life overall ratio"
              ourValue={`${comparison.settlement.ours_pct}%`}           ourDetail="AI-assisted decisions"
              improvement={comparison.settlement.gap >= 0 ? `+${comparison.settlement.gap}pp above industry` : `${comparison.settlement.gap}pp vs industry`}
              improvementPositive={comparison.settlement.gap >= 0} note="Compared against IRDAI non-life overall settlement ratio." />
            <CompareCard title="Manual Processing Steps"
              industryValue={`${comparison.manual_effort.industry_steps} steps`} industryDetail="manual touchpoints per claim"
              ourValue="Zero" ourDetail="fully automated pipeline"
              improvement="8-agent LangGraph pipeline" note="Human-in-loop only for escalations and overrides." />
          </div>
        )}
      </section>

      {/* ── Segment Analysis ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader accent="sky">Segment Analysis · {irdai.fiscal_year}</SectionHeader>
        <div className="surface rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Segment", "Settlement Ratio", "Premium Share", "YoY Growth", "Fraud Risk"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-[10px] font-semibold text-[#334155] uppercase tracking-wider ${i === 0 ? "text-left" : i === 4 ? "text-center" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {irdai.segments.map((seg) => {
                const riskStyle =
                  seg.fraud_risk === "High"   ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  seg.fraud_risk === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                return (
                  <tr key={seg.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-[#e2e8f0] font-medium text-sm">{seg.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-20 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-sky-500/60" style={{ width: `${seg.claim_ratio_pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-white tabular-nums w-14 text-right">{seg.claim_ratio_pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-[#64748b] tabular-nums">{seg.premium_share_pct}%</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-xs font-semibold tabular-nums ${seg.yoy_growth_pct >= 15 ? "text-emerald-400" : "text-[#64748b]"}`}>
                        +{seg.yoy_growth_pct}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${riskStyle}`}>{seg.fraud_risk}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Fraud Landscape + Global Context ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section>
          <SectionHeader accent="red">Industry Fraud Landscape</SectionHeader>
          <div className="surface rounded-xl p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold text-red-400 tabular-nums">${irdai.fraud.annual_fraud_loss_usd_bn}B</div>
                <div className="text-xs text-[#475569] mt-1">Estimated annual fraud loss</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-red-400 tabular-nums">{irdai.fraud.estimated_fraud_pct_of_claims}%</div>
                <div className="text-xs text-[#475569] mt-1">of total claims</div>
              </div>
            </div>
            {irdai.fraud.prev_annual_fraud_loss_usd_bn && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#475569] border-t border-white/[0.04] pt-3">
                <span className="text-red-400/70">↑</span>
                <span>+${(irdai.fraud.annual_fraud_loss_usd_bn - irdai.fraud.prev_annual_fraud_loss_usd_bn).toFixed(1)}B vs {irdai.prev_fiscal_year}</span>
                <span className="ml-auto text-[#334155]">{irdai.fraud.avg_detection_time_days}d avg detection time</span>
              </div>
            )}
            <div className="space-y-3 pt-1">
              {[
                { label: "Motor",  pct: irdai.fraud.motor_fraud_pct,  color: "#3b82f6" },
                { label: "Health", pct: irdai.fraud.health_fraud_pct, color: "#ef4444" },
                { label: "Life",   pct: irdai.fraud.life_fraud_pct,   color: "#a855f7" },
                { label: "Other",  pct: irdai.fraud.other_fraud_pct,  color: "#475569" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-[#94a3b8]">{f.label}</span>
                    <span className="text-[11px] font-bold text-white tabular-nums">{f.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[11px]">
              <span className="text-[#b84dff] font-semibold">↑ Our AI:</span>
              <span className="text-[#475569]">
                Real-time scoring on every claim. {comparison.fraud_detection.our_flagging_rate_pct}% flagged vs {irdai.fraud.estimated_fraud_pct_of_claims}% industry estimate.
              </span>
            </div>
          </div>
        </section>

        {gc && (
          <section>
            <SectionHeader accent="sky">Global Context · India vs World</SectionHeader>
            <div className="surface rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-1">Global</div>
                  <div className="text-lg font-bold text-white tabular-nums">${gc.global_market_usd_t}T</div>
                  <div className="text-[10px] text-[#475569] mt-0.5">total market</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-1">India Share</div>
                  <div className="text-lg font-bold text-sky-400 tabular-nums">{gc.india_share_pct}%</div>
                  <div className="text-[10px] text-[#475569] mt-0.5">{gc.india_rank_by_premium ? `rank #${gc.india_rank_by_premium}` : "of global"}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-1">2030 Target</div>
                  <div className="text-lg font-bold text-violet-400 tabular-nums">${gc.india_target_2030_usd_bn}B</div>
                  <div className="text-[10px] text-[#475569] mt-0.5">{((m.total_premium_usd_bn / (gc.india_target_2030_usd_bn ?? 280)) * 100).toFixed(0)}% reached</div>
                </div>
              </div>
              <div className="space-y-2.5">
                <CompareRow label="Penetration (GDP)" ours={`${m.insurance_penetration_gdp_pct}%`} global={`${gc.global_penetration_pct}%`} />
                <CompareRow label="Density (per capita)" ours={`$${m.insurance_density_usd_per_capita}`} global={`$${gc.global_density_usd}`} />
                <CompareRow label="Fraud rate est." ours={`${irdai.fraud.estimated_fraud_pct_of_claims}%`} global={`${gc.global_fraud_pct}%`} ourHigher />
                <CompareRow label="Avg. processing" ours={`${irdai.claims.avg_settlement_days_industry}d`} global={`${gc.global_avg_processing_days}d`} ourHigher />
              </div>
              {gc.india_target_2030_usd_bn && (
                <div className="pt-2 border-t border-white/[0.04]">
                  <div className="text-[10px] text-[#334155] mb-1.5">Progress to 2030 goal</div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-sky-500/60"
                      style={{ width: `${Math.min((m.total_premium_usd_bn / gc.india_target_2030_usd_bn) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── Regulatory Updates (accordion) ──────────────────────────────────── */}
      {updates.length > 0 && (
        <section>
          <SectionHeader accent="amber">2024-25 Regulatory Developments</SectionHeader>
          <div className="space-y-2">
            {updates.map((u) => {
              const isOpen = openUpdate === u.title;
              const impactStyle =
                u.impact === "Digital"   ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                u.impact === "Faster"    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                u.impact === "Expansion" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                                           "bg-amber-500/10 text-amber-400 border-amber-500/20";
              return (
                <div key={u.title} className={`surface rounded-xl overflow-hidden border transition-all ${isOpen ? "border-amber-500/20" : "border-transparent"}`}>
                  <button
                    onClick={() => setOpenUpdate(isOpen ? null : u.title)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <svg className={`w-3.5 h-3.5 shrink-0 text-[#334155] transition-transform ${isOpen ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-white flex-1 text-left">{u.title}</span>
                    <span className="text-[10px] text-[#334155] shrink-0">Effective {u.year}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${impactStyle}`}>
                      {u.impact}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-0 border-t border-white/[0.04]">
                      <p className="text-[12px] text-[#64748b] leading-relaxed pt-3">{u.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Grievances ──────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader accent="sky">Consumer Grievances · {irdai.fiscal_year}</SectionHeader>
        <div className="surface rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{irdai.grievances.total_complaints_fy23.toLocaleString()}</div>
              <div className="text-xs text-[#475569] mt-1">Total complaints filed</div>
              {irdai.grievances.yoy_change_pct && (
                <div className="text-[11px] mt-1">
                  <span className={irdai.grievances.yoy_change_pct < 0 ? "text-emerald-400" : "text-red-400"}>
                    {irdai.grievances.yoy_change_pct > 0 ? "+" : ""}{irdai.grievances.yoy_change_pct}%
                  </span>
                  <span className="text-[#334155]"> YoY</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">{irdai.grievances.resolution_rate_pct}%</div>
              <div className="text-xs text-[#475569] mt-1">Resolution rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{irdai.grievances.avg_resolution_days}d</div>
              <div className="text-xs text-[#475569] mt-1">Avg resolution time</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance Footer ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3.5 px-5 py-4 rounded-xl surface border-l-2 border-[#A100FF]/40">
        <svg className="w-4 h-4 text-[#b84dff] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div className="text-[11px] leading-relaxed text-[#64748b]">
          <span className="text-white font-semibold">IRDAI Compliance · </span>
          Mandate: settlement within {irdai.claims.avg_settlement_days_mandate} days
          {irdai.claims.avg_settlement_days_health_cashless_mandate && ` (${irdai.claims.avg_settlement_days_health_cashless_mandate}d for health cashless — 2024 regulation)`}.
          {" "}Our AI pipeline processes claims in under 2 seconds — {comparison.compliance.margin_pct}% ahead of mandate.
          Every claim generates a tamper-proof MongoDB audit trail for regulatory inspection.
        </div>
      </div>

    </div>
  );
}

// ── Trend Line Chart (pure SVG) ────────────────────────────────────────────────

type TrendPoint = {
  year: string; total_premium_usd_bn: number;
  penetration_pct: number; growth_pct: number;
  estimated?: boolean; projected?: boolean;
};

function TrendLineChart({ trend, currentYear }: { trend: TrendPoint[]; currentYear: string }) {
  const W = 560, H = 190;
  const PAD = { t: 16, r: 24, b: 44, l: 52 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const vals = trend.map((t) => t.total_premium_usd_bn);
  const minV = Math.min(...vals) * 0.86;
  const maxV = Math.max(...vals) * 1.08;

  const px = (i: number) => PAD.l + (i / (trend.length - 1)) * cW;
  const py = (v: number) => H - PAD.b - ((v - minV) / (maxV - minV)) * cH;

  const splitIdx = trend.findIndex((t) => t.estimated || t.projected);
  const actual   = splitIdx >= 0 ? trend.slice(0, splitIdx + 1) : trend;
  const future   = splitIdx >= 0 ? trend.slice(splitIdx)        : [];

  const lineD = (pts: TrendPoint[], offset: number) =>
    pts.map((t, i) => `${i === 0 ? "M" : "L"}${px(offset + i).toFixed(1)},${py(t.total_premium_usd_bn).toFixed(1)}`).join(" ");

  const areaD = (pts: TrendPoint[], offset: number) =>
    `${lineD(pts, offset)} L${px(offset + pts.length - 1).toFixed(1)},${(H - PAD.b).toFixed(1)} L${px(offset).toFixed(1)},${(H - PAD.b).toFixed(1)} Z`;

  const yTicks = [minV, minV + (maxV - minV) * 0.33, minV + (maxV - minV) * 0.66, maxV];

  return (
    <div className="surface rounded-xl p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "190px" }}>
        <defs>
          <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#A100FF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#A100FF" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis grid */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={py(v)} x2={W - PAD.r} y2={py(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={PAD.l - 6} y={py(v) + 3.5} textAnchor="end" fontSize={9} fill="#334155">${v.toFixed(0)}B</text>
          </g>
        ))}

        {/* Area fills */}
        {actual.length > 1 && <path d={areaD(actual, 0)} fill="url(#aGrad)" />}
        {future.length > 1 && <path d={areaD(future, splitIdx)} fill="url(#fGrad)" />}

        {/* Divider line at split */}
        {splitIdx > 0 && (
          <line x1={px(splitIdx)} y1={PAD.t} x2={px(splitIdx)} y2={H - PAD.b}
            stroke="rgba(124,58,237,0.28)" strokeWidth={1} strokeDasharray="4 3" />
        )}

        {/* Lines */}
        {actual.length > 1 && (
          <path d={lineD(actual, 0)} fill="none" stroke="#A100FF" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
        )}
        {future.length > 1 && (
          <path d={lineD(future, splitIdx)} fill="none" stroke="#7c3aed" strokeWidth={1.5}
            strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Data points + value labels */}
        {trend.map((t, i) => {
          const isFuture  = t.estimated || t.projected;
          const isCurrent = t.year === currentYear;
          return (
            <g key={t.year}>
              {isCurrent && (
                <circle cx={px(i)} cy={py(t.total_premium_usd_bn)} r={7}
                  fill="#A100FF" fillOpacity={0.15} />
              )}
              <circle cx={px(i)} cy={py(t.total_premium_usd_bn)} r={isCurrent ? 4 : 3}
                fill={isFuture ? "#7c3aed" : "#A100FF"}
                stroke={isFuture ? "#2e1065" : "#1e003f"}
                strokeWidth={1.5}
              />
              <text x={px(i)} y={py(t.total_premium_usd_bn) - 9} textAnchor="middle" fontSize={8.5}
                fill={isFuture ? "#7c3aed" : isCurrent ? "#e2e8f0" : "#475569"} fontWeight={isCurrent ? "bold" : "normal"}>
                ${t.total_premium_usd_bn}B
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {trend.map((t, i) => (
          <text key={`lbl-${t.year}`} x={px(i)} y={H - 6} textAnchor="middle" fontSize={9}
            fill={t.estimated || t.projected ? "#7c3aed" : t.year === currentYear ? "#94a3b8" : "#475569"}>
            {t.year.replace("FY", "")}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-1 pl-12">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 rounded" style={{ background: "#A100FF" }} />
          <span className="text-[10px] text-[#475569]">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-px border-t border-dashed border-[#7c3aed]" />
          <span className="text-[10px] text-[#7c3aed]">Estimated / Projected</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="w-2 h-2 rounded-full bg-[#A100FF]" />
          <span className="text-[10px] text-[#475569]">Current year highlighted</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ children, accent = "sky" }: {
  children: React.ReactNode;
  accent?: "sky" | "emerald" | "amber" | "red" | "violet" | "purple";
}) {
  const dot: Record<string, string> = {
    sky: "bg-sky-500", emerald: "bg-emerald-500", amber: "bg-amber-500",
    red: "bg-red-500", violet: "bg-violet-500", purple: "bg-[#A100FF]",
  };
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot[accent]}`} />
      <h2 className="text-[10px] font-semibold text-[#475569] uppercase tracking-[0.1em]">{children}</h2>
    </div>
  );
}

function KpiCard({ label, value, sub, badge, accent = "white" }: {
  label: string; value: string | number; sub: string;
  badge?: { text: string; up: boolean; neutral?: boolean };
  accent?: "white" | "emerald" | "sky";
}) {
  const valColor = accent === "emerald" ? "text-emerald-400" : accent === "sky" ? "text-sky-400" : "text-white";
  return (
    <div className="surface rounded-xl px-5 py-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className={`text-2xl font-bold tabular-nums leading-none ${valColor}`}>{value}</div>
        {badge && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tabular-nums shrink-0 border ${
            badge.neutral ? "bg-white/[0.04] text-[#475569] border-white/[0.08]"
              : badge.up   ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                           : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}>
            {!badge.neutral && (badge.up ? "↑ " : "↓ ")}{badge.text}
          </span>
        )}
      </div>
      <div>
        <div className="text-xs text-[#e2e8f0] font-medium">{label}</div>
        <div className="text-[10px] text-[#334155] mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function CompareCard({ title, industryValue, industryDetail, ourValue, ourDetail, improvement, improvementPositive = true, note }: {
  title: string; industryValue: string; industryDetail: string;
  ourValue: string; ourDetail: string; improvement: string;
  improvementPositive?: boolean; note: string;
}) {
  return (
    <div className="surface rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.05]">
        <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-[0.1em]">{title}</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
        <div className="px-5 py-4">
          <div className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-2.5">Industry</div>
          <div className="text-xl font-bold text-[#94a3b8] tabular-nums leading-none mb-1.5">{industryValue}</div>
          <div className="text-[11px] text-[#475569]">{industryDetail}</div>
        </div>
        <div className="px-5 py-4 bg-[#A100FF]/[0.03]">
          <div className="text-[9px] font-bold text-[#b84dff] uppercase tracking-widest mb-2.5">Our AI</div>
          <div className="text-xl font-bold text-white tabular-nums leading-none mb-1.5">{ourValue}</div>
          <div className="text-[11px] text-[#475569]">{ourDetail}</div>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-white/[0.05] bg-[#A100FF]/[0.04] flex items-center gap-2">
        <span className={`text-[11px] font-semibold ${improvementPositive ? "text-emerald-400" : "text-amber-400"}`}>
          {improvementPositive ? "↑" : "→"} {improvement}
        </span>
        <span className="text-[#334155] text-[11px] ml-auto">{note}</span>
      </div>
    </div>
  );
}

function CompareRow({ label, ours, global: glob, ourHigher = false }: {
  label: string; ours: string; global: string; ourHigher?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
      <span className="text-[11px] text-[#475569]">{label}</span>
      <div className="flex items-center gap-3">
        <span className={`text-[11px] font-semibold tabular-nums ${ourHigher ? "text-amber-400" : "text-sky-400"}`}>
          {ours} <span className="text-[9px] font-normal text-[#334155]">India</span>
        </span>
        <span className="text-[#2d3748]">·</span>
        <span className="text-[11px] text-[#64748b] tabular-nums">
          {glob} <span className="text-[9px] text-[#334155]">global</span>
        </span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse max-w-[1200px]">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-5 w-64 rounded bg-white/[0.06]" />
          <div className="h-3 w-80 rounded bg-white/[0.04]" />
        </div>
        <div className="h-8 w-40 rounded-lg bg-white/[0.04]" />
      </div>
      <div className="h-8 rounded-lg bg-white/[0.03]" />
      <div className="grid grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />)}
      </div>
      <div className="h-52 rounded-xl bg-white/[0.04]" />
      <div className="h-10 rounded-xl bg-white/[0.03]" />
      <div className="h-52 rounded-xl bg-white/[0.04]" />
      <div className="space-y-2">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/[0.04]" />)}
      </div>
    </div>
  );
}
