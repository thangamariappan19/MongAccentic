"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type Role = "manager" | "adjuster" | "fraud_analyst" | "underwriter";

const ROLES: { value: Role; label: string; subtitle: string; emoji: string }[] = [
  { value: "manager",       label: "Manager",         subtitle: "Portfolio Overview",   emoji: "M" },
  { value: "adjuster",      label: "Claims Adjuster", subtitle: "Claims Processing",    emoji: "A" },
  { value: "fraud_analyst", label: "Fraud Analyst",   subtitle: "SIU · Investigations", emoji: "F" },
  { value: "underwriter",   label: "Underwriter",     subtitle: "Risk Assessment",      emoji: "U" },
];

const NAV_STEPS = [
  { step: 1, href: "/",             label: "Overview",       chapter: "The Problem",      roles: ["manager","adjuster","fraud_analyst","underwriter"] as Role[] },
  { step: 2, href: "/submit",       label: "Submit Claim",   chapter: "Watch AI Work",    roles: ["manager","adjuster"] as Role[] },
  { step: 3, href: "/claims",       label: "Claims",         chapter: "AI Decisions",     roles: ["manager","adjuster","fraud_analyst"] as Role[] },
  { step: 4, href: "/rings",        label: "Fraud Rings",    chapter: "Fraud Caught",     live: true, roles: ["manager","fraud_analyst"] as Role[] },
  { step: 5, href: "/advisory",     label: "AI Intelligence",chapter: "Portfolio Insights",roles: ["manager","adjuster","underwriter"] as Role[] },
  { step: 6, href: "/benchmark",    label: "IRDAI Benchmark",chapter: "Proof of Impact",  roles: ["manager","underwriter"] as Role[] },
  { step: 7, href: "/underwriting", label: "Underwriting",   chapter: "Risk Assessment",  roles: ["manager","underwriter"] as Role[] },
];

export default function MobileNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("manager");
  const [roleOpen, setRoleOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("demo_role") as Role | null;
    if (saved) setRole(saved);
  }, []);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [path]);

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

  const visibleSteps = NAV_STEPS.filter(s => s.roles.includes(role));
  const activeStep   = visibleSteps.find(s => isActive(s.href));
  const currentRole  = ROLES.find(r => r.value === role)!;

  const switchRole = (r: Role) => {
    setRole(r);
    localStorage.setItem("demo_role", r);
    setRoleOpen(false);
  };

  return (
    <>
      {/* ── Top bar ── */}
      <header
        className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
        style={{ background: "#0f172a" }}
      >
        {/* Logo + current chapter */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 text-white"
            style={{ background: "#A100FF" }}
          >
            M
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white leading-none">MongAccentic</div>
            {activeStep ? (
              <div className="text-[10px] mt-0.5 truncate" style={{ color: "#A100FF" }}>
                Ch {activeStep.step} · {activeStep.chapter}
              </div>
            ) : (
              <div className="text-[10px] mt-0.5 text-[#334155]">AI Claims Intelligence</div>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {/* Submit CTA */}
          <Link
            href="/submit"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "#A100FF" }}
          >
            + Claim
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Open menu"
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
          >
            <span className={`block h-0.5 bg-white rounded-full transition-all origin-center ${open ? "w-5 rotate-45 translate-y-2" : "w-5"}`} />
            <span className={`block h-0.5 bg-white rounded-full transition-all ${open ? "w-0 opacity-0" : "w-4"}`} />
            <span className={`block h-0.5 bg-white rounded-full transition-all origin-center ${open ? "w-5 -rotate-45 -translate-y-2" : "w-5"}`} />
          </button>
        </div>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in drawer ── */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col border-l border-white/[0.06] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#0f172a" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <div>
            <div className="text-sm font-semibold text-white">Demo Journey</div>
            <div className="text-[10px] text-[#334155] mt-0.5">7-chapter story</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4b5563] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current chapter badge */}
        {activeStep && (
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl" style={{ background: "#A100FF0d", border: "1px solid #A100FF20" }}>
            <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#A100FF80" }}>
              Now viewing · Chapter {activeStep.step} of {visibleSteps.length}
            </div>
            <div className="text-[12px] font-semibold text-white">{activeStep.chapter}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "#A100FF70" }}>{activeStep.label}</div>
          </div>
        )}

        {/* Nav steps */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <div className="px-3 py-1 text-[9px] font-semibold text-[#1e2a3a] uppercase tracking-widest">
            Chapters
          </div>
          {visibleSteps.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-colors relative ${
                  active
                    ? "bg-white/[0.06] text-white"
                    : "text-[#4b5563] hover:text-[#94a3b8] hover:bg-white/[0.03]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" style={{ background: "#A100FF" }} />
                )}
                {/* Step badge */}
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                  style={{ background: active ? "#A100FF" : "#0d1117" }}
                >
                  {item.step}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="leading-tight">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${active ? "text-[#A100FF]/60" : "text-[#1e2a3a]"}`}>
                    {item.chapter}
                  </div>
                </div>
                {item.live && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                {active && (
                  <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "#A100FF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 h-px bg-white/[0.05]" />

        {/* Role switcher */}
        <div className="px-3 py-4 space-y-2">
          <div className="text-[9px] font-semibold text-[#1e2a3a] uppercase tracking-widest px-1">Switch Role</div>
          <div className="relative">
            <button
              onClick={() => setRoleOpen(o => !o)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.10] transition-colors"
              style={{ background: "#1e293b" }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                style={{ background: "#A100FF" }}>
                {currentRole.emoji}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[12px] font-medium text-white">{currentRole.label}</div>
                <div className="text-[10px] text-[#334155]">{currentRole.subtitle}</div>
              </div>
              <svg className={`w-4 h-4 text-[#334155] shrink-0 transition-transform ${roleOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {roleOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/[0.08] overflow-hidden z-50"
                style={{ background: "#1e293b" }}>
                <div className="px-3 py-2 text-[9px] font-semibold text-[#334155] uppercase tracking-wider border-b border-white/[0.05]">
                  Select Role · Nav adapts
                </div>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => switchRole(r.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-3 transition-colors text-left ${
                      r.value === role ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                      style={{ background: r.value === role ? "#A100FF" : "#1e293b" }}>
                      {r.emoji}
                    </div>
                    <div className="flex-1">
                      <div className={`text-[12px] font-medium ${r.value === role ? "text-white" : "text-[#64748b]"}`}>{r.label}</div>
                      <div className="text-[9px] text-[#334155]">{r.subtitle}</div>
                    </div>
                    {r.value === role && (
                      <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "#A100FF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live status */}
          <div className="flex items-center gap-2 px-1">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-[#334155]">5 agents · MongoDB Atlas · Live</span>
          </div>
        </div>
      </div>
    </>
  );
}
