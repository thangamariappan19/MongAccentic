"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubmission, type LOB } from "@/lib/api";

const LOB_OPTIONS: { value: LOB; label: string; icon: string; desc: string }[] = [
  { value: "commercial_property", label: "Commercial Property",  icon: "🏢", desc: "Buildings, equipment, inventory" },
  { value: "general_liability",   label: "General Liability",    icon: "⚖️", desc: "Bodily injury, property damage" },
  { value: "workers_comp",        label: "Workers Compensation", icon: "👷", desc: "Employee workplace injuries" },
  { value: "cyber",               label: "Cyber Liability",      icon: "🔒", desc: "Data breach, ransomware, BI" },
];

const SAMPLE_DOCS: Record<LOB, string[]> = {
  commercial_property: ["ACORD_125_Application.pdf", "Schedule_of_Values.pdf", "Inspection_Report.pdf", "5yr_Loss_Run.pdf"],
  general_liability:   ["ACORD_126_Application.pdf", "Financial_Statements.pdf", "Loss_Run_Report.pdf"],
  workers_comp:        ["WC_Application.pdf", "Payroll_Records.pdf", "NCCI_Bureau_Report.pdf", "Loss_Run_5yr.pdf"],
  cyber:               ["Cyber_Application.pdf", "IT_Security_Controls.pdf", "Financial_Statements.pdf"],
};

type Step = "form" | "extracting" | "done";

const EXTRACTION_STEPS = [
  { label: "Parsing uploaded documents…",          icon: "📄", pct: 20 },
  { label: "Running Document Intelligence Agent…", icon: "🤖", pct: 45 },
  { label: "Extracting underwriting fields…",      icon: "🔍", pct: 65 },
  { label: "Running Gap Analysis Agent…",          icon: "⚡", pct: 82 },
  { label: "Generating field guidance…",           icon: "💡", pct: 100 },
];

export default function NewSubmissionPage() {
  const router = useRouter();
  const [form, setForm] = useState({ insured_name: "", line_of_business: "commercial_property" as LOB, broker_name: "" });
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("form");
  const [extractionStep, setExtractionStep] = useState(0);
  const [error, setError] = useState("");

  function toggleDoc(doc: string) {
    setSelectedDocs((prev) => prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.insured_name.trim()) { setError("Insured name is required"); return; }
    setError("");
    setStep("extracting");
    setExtractionStep(0);

    // Animate extraction steps
    for (let i = 0; i < EXTRACTION_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      setExtractionStep(i + 1);
    }

    try {
      const docs = selectedDocs.length > 0 ? selectedDocs : SAMPLE_DOCS[form.line_of_business];
      const sub = await createSubmission({ ...form, documents: docs });
      setStep("done");
      setTimeout(() => router.push(`/underwriting/${sub.submission_id}`), 800);
    } catch (err) {
      setStep("form");
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  if (step === "extracting" || step === "done") {
    const currentStep = EXTRACTION_STEPS[Math.min(extractionStep - 1, EXTRACTION_STEPS.length - 1)];
    const done = step === "done" || extractionStep >= EXTRACTION_STEPS.length;
    return (
      <div className="max-w-lg mx-auto py-16 space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-4">{done ? "✅" : currentStep?.icon ?? "🤖"}</div>
          <h2 className="text-xl font-bold text-white">{done ? "Extraction Complete!" : "Processing Documents…"}</h2>
          <p className="text-[#4b5563] text-sm mt-1">{done ? "Redirecting to review…" : currentStep?.label}</p>
        </div>

        {/* Progress bar */}
        <div className="bg-[#0f1015] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex justify-between text-xs text-[#4b5563] mb-2">
            <span>Progress</span>
            <span className="tabular-nums">{done ? 100 : EXTRACTION_STEPS[extractionStep - 1]?.pct ?? 0}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#6C63FF] transition-all duration-500"
              style={{ width: `${done ? 100 : EXTRACTION_STEPS[extractionStep - 1]?.pct ?? 0}%` }}
            />
          </div>
          <div className="space-y-2 mt-2">
            {EXTRACTION_STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-colors ${
                i < extractionStep ? "text-[#b84dff]" : i === extractionStep - 1 ? "text-white" : "text-[#374151]"
              }`}>
                <span>{i < extractionStep ? "✓" : i === extractionStep - 1 ? "▶" : "○"}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="text-[#4b5563] text-xs mb-1">
          <span className="hover:text-white cursor-pointer" onClick={() => router.push("/underwriting")}>← Underwriting</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">New Submission</h1>
        <p className="text-[#4b5563] text-sm mt-1">
          AI agents will extract underwriting fields from your documents and flag anything missing for review
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Insured Name */}
        <div>
          <label className="block text-sm font-medium text-[#d1d5db] mb-1.5">Named Insured *</label>
          <input
            type="text"
            value={form.insured_name}
            onChange={(e) => setForm({ ...form, insured_name: e.target.value })}
            placeholder="e.g. Acme Manufacturing Corp"
            className="w-full bg-[#0f1015] border border-white/[0.07] rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6C63FF]/50 text-sm"
          />
        </div>

        {/* Broker */}
        <div>
          <label className="block text-sm font-medium text-[#d1d5db] mb-1.5">Broker / Agent Name</label>
          <input
            type="text"
            value={form.broker_name}
            onChange={(e) => setForm({ ...form, broker_name: e.target.value })}
            placeholder="e.g. Marsh McLennan, Aon, Willis Towers Watson"
            className="w-full bg-[#0f1015] border border-white/[0.07] rounded-lg px-4 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6C63FF]/50 text-sm"
          />
        </div>

        {/* Line of Business */}
        <div>
          <label className="block text-sm font-medium text-[#d1d5db] mb-2">Line of Business *</label>
          <div className="grid grid-cols-2 gap-2">
            {LOB_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setForm({ ...form, line_of_business: opt.value }); setSelectedDocs([]); }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  form.line_of_business === opt.value
                    ? "border-[#6C63FF]/40 bg-[#6C63FF]/[0.06] text-[#b84dff]"
                    : "border-white/[0.07] text-[#6b7280] hover:border-white/[0.12] hover:text-[#d1d5db]"
                }`}
              >
                <span className="text-xl mt-0.5">{opt.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div>
          <label className="block text-sm font-medium text-[#d1d5db] mb-2">Documents to Process</label>
          <div className="bg-[#0f1015] border border-dashed border-white/[0.12] rounded-xl p-4 space-y-3">
            <div className="text-[11px] text-[#4b5563] text-center mb-2">
              Select which documents are available for extraction
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_DOCS[form.line_of_business].map((doc) => (
                <button
                  key={doc}
                  type="button"
                  onClick={() => toggleDoc(doc)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border text-left transition-all ${
                    selectedDocs.includes(doc)
                      ? "border-[#6C63FF]/30 bg-[#6C63FF]/[0.06] text-[#b84dff]"
                      : "border-white/[0.07] text-[#6b7280] hover:border-white/[0.12]"
                  }`}
                >
                  <span>{selectedDocs.includes(doc) ? "✓" : "📄"}</span>
                  <span className="truncate">{doc}</span>
                </button>
              ))}
            </div>
            <div className="text-[10px] text-[#374151] text-center">
              {selectedDocs.length === 0 ? "All documents will be processed by default" : `${selectedDocs.length} document(s) selected`}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
        )}

        {/* Submit */}
        <div className="bg-[#0f1015] border border-white/[0.07] rounded-xl p-4 space-y-2">
          <div className="text-[11px] text-[#4b5563]">What happens next:</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {["AI extracts fields", "Gaps flagged", "Ready to review"].map((s, i) => (
              <div key={i} className="text-[10px] text-[#6b7280]">
                <div className="text-emerald-400 text-base mb-0.5">{["🤖", "🔍", "✍️"][i]}</div>
                {s}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#8900d9] hover:bg-[#6C63FF] text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#8900d9]/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Extract & Analyze
        </button>
      </form>
    </div>
  );
}
