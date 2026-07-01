"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type Role = "manager" | "adjuster" | "fraud_analyst" | "underwriter";

const ROLES: { value: Role; label: string; subtitle: string }[] = [
  { value: "manager",       label: "Manager",         subtitle: "Portfolio Overview" },
  { value: "adjuster",      label: "Claims Adjuster", subtitle: "Claims Processing" },
  { value: "fraud_analyst", label: "Fraud Analyst",   subtitle: "SIU · Investigations" },
  { value: "underwriter",   label: "Underwriter",     subtitle: "Risk Assessment" },
];

// Story steps — each page is a chapter in the demo
const STORY_STEPS = [
  {
    step: 1,
    href: "/",
    label: "Overview",
    chapter: "The Problem",
    roles: ["manager", "adjuster", "fraud_analyst", "underwriter"] as Role[],
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ),
  },
  {
    step: 2,
    href: "/submit",
    label: "Submit Claim",
    chapter: "Watch AI Work",
    roles: ["manager", "adjuster"] as Role[],
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    step: 3,
    href: "/claims",
    label: "Claims",
    chapter: "AI Decisions",
    roles: ["manager", "adjuster", "fraud_analyst"] as Role[],
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    step: 4,
    href: "/rings",
    label: "Fraud Rings",
    chapter: "Fraud Caught",
    live: true,
    roles: ["manager", "fraud_analyst"] as Role[],
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="2.5" />
        <circle cx="5" cy="5" r="1.75" /><circle cx="19" cy="5" r="1.75" />
        <circle cx="5" cy="19" r="1.75" /><circle cx="19" cy="19" r="1.75" />
        <path strokeLinecap="round" d="M7 7l3.5 3.5M13.5 13.5L17 17M17 7l-3.5 3.5M10.5 13.5L7 17" />
      </svg>
    ),
  },
  {
    step: 5,
    href: "/advisory",
    label: "AI Intelligence",
    chapter: "Portfolio Insights",
    roles: ["manager", "adjuster", "underwriter"] as Role[],
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    step: 6,
    href: "/benchmark",
    label: "IRDAI Benchmark",
    chapter: "Proof of Impact",
    roles: ["manager", "underwriter"] as Role[],
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    step: 7,
    href: "/underwriting",
    label: "Underwriting",
    chapter: "Risk Assessment",
    roles: ["manager", "underwriter"] as Role[],
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const path = usePathname();
  const [role, setRole] = useState<Role>("manager");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("demo_role") as Role | null;
    if (saved) setRole(saved);
  }, []);

  const switchRole = (r: Role) => {
    setRole(r);
    localStorage.setItem("demo_role", r);
    setOpen(false);
  };

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

  const visibleSteps = STORY_STEPS.filter(s => s.roles.includes(role));
  const currentRole  = ROLES.find(r => r.value === role)!;
  const activeStep   = visibleSteps.find(s => isActive(s.href));

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col h-screen sticky top-0"
      style={{ background: "#223A66" }}>

      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 text-white" style={{ background: "#6C63FF" }}>
            M
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white leading-tight">MongAccentic</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>AI Claims Intelligence</div>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />

      {/* Current chapter indicator */}
      {activeStep && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg" style={{ background: "rgba(108,99,255,0.2)", border: "1px solid rgba(108,99,255,0.4)" }}>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#a5b4fc" }}>
            Chapter {activeStep.step} of {visibleSteps.length}
          </div>
          <div className="text-[11px] font-semibold text-white">{activeStep.chapter}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "rgba(165,180,252,0.7)" }}>{activeStep.label}</div>
        </div>
      )}

      {/* Story nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
          Demo Journey
        </div>
        {visibleSteps.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all relative group`}
              style={active
                ? { background: "rgba(255,255,255,0.12)", color: "white" }
                : { color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = ""; }}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full" style={{ background: "#FFC107" }} />
              )}

              {/* Step number */}
              <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
                style={active
                  ? { background: "#6C63FF", color: "white" }
                  : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                {item.step}
              </span>

              <div className="flex-1 min-w-0">
                <div className="leading-tight">{item.label}</div>
                <div className="text-[9px] mt-0.5 truncate" style={{ color: active ? "rgba(165,180,252,0.8)" : "rgba(255,255,255,0.35)" }}>
                  {item.chapter}
                </div>
              </div>

              {item.live && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Bottom: role switcher + status */}
      <div className="px-2 py-4 space-y-3">
        {/* Role switcher */}
        <div className="relative">
          <button onClick={() => setOpen(o => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
            style={{ background: "rgba(255,255,255,0.06)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
              style={{ background: "#0D6EFD" }}>
              {currentRole.label[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-white truncate">{currentRole.label}</div>
              <div className="text-[9px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{currentRole.subtitle}</div>
            </div>
            <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
              style={{ color: "rgba(255,255,255,0.4)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg overflow-hidden z-50"
              style={{ background: "#1a2d52", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
              <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>Switch Role · Nav Changes</div>
              {ROLES.map(r => (
                <button key={r.value} onClick={() => switchRole(r.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{ background: r.value === role ? "rgba(108,99,255,0.2)" : "" }}
                  onMouseEnter={e => { if (r.value !== role) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (r.value !== role) e.currentTarget.style.background = ""; }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                    style={{ background: r.value === role ? "#6C63FF" : "rgba(255,255,255,0.15)" }}>
                    {r.label[0]}
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-white">{r.label}</div>
                    <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{r.subtitle}</div>
                  </div>
                  {r.value === role && (
                    <svg className="w-3 h-3 ml-auto" style={{ color: "#FFC107" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>5 agents · MongoDB Atlas</span>
        </div>
      </div>
    </aside>
  );
}
