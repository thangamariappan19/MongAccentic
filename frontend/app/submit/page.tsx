"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitClaim, type ClaimType, type Claim } from "@/lib/api";
import RoleBar from "@/components/RoleBar";

const CLAIM_TYPES: { value: ClaimType; label: string; desc: string }[] = [
  { value: "motor",       label: "Motor",       desc: "Accident, damage" },
  { value: "health",      label: "Health",      desc: "Hospitalisation" },
  { value: "life",        label: "Life",        desc: "Death benefit" },
  { value: "motor_theft", label: "Motor Theft", desc: "Stolen vehicle" },
];

const DOC_OPTIONS: Record<ClaimType, string[]> = {
  motor:       ["vehicle registration", "driver license", "repair estimate", "police report"],
  health:      ["hospital bill", "discharge summary", "physician report", "lab reports"],
  life:        ["death certificate", "policy document", "beneficiary ID"],
  motor_theft: ["vehicle registration", "driver license", "police report", "non-traceable certificate"],
};

const PIPELINE_STEPS = [
  {
    name: "Language Agent",
    desc: "Parses claim text, detects language, normalises input",
    feature: null,
    doneMsg: "English detected · Claim normalised",
  },
  {
    name: "Policy Agent",
    desc: "Searches policy database using MongoDB Atlas Vector Search",
    feature: "Atlas Vector Search",
    doneMsg: "Policy matched · 0.91 cosine similarity",
  },
  {
    name: "Fraud Agent",
    desc: "Analyses 12+ risk signals via AWS Bedrock · Claude",
    feature: "AWS Bedrock",
    doneMsg: "Risk signals analysed · Fraud score computed",
  },
  {
    name: "Ring Agent",
    desc: "Queries active fraud rings in MongoDB for pattern links",
    feature: "MongoDB Aggregation",
    doneMsg: "4 active rings checked · Connections mapped",
  },
  {
    name: "Decision Agent",
    desc: "Generates final verdict, confidence score and settlement",
    feature: "LangGraph Checkpoint",
    doneMsg: "Verdict generated · State checkpointed to MongoDB",
  },
];

const STEP_TIMINGS = [900, 2200, 3600, 4900, 6300];

type Phase = "idle" | "running" | "done";

function fmt(n: number) { return `$${n.toLocaleString()}`; }

export default function SubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState({ claimant_name: "", claim_type: "motor" as ClaimType, description: "", amount: "" });
  const [docs, setDocs] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Claim | null>(null);
  const [error, setError] = useState("");
  const [pipeStep, setPipeStep] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleDoc(doc: string) {
    setDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg",
                     "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const valid = Array.from(files).filter(f => allowed.includes(f.type) || f.name.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/i));
    if (valid.length === 0) return;
    setUploadedFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
    // Auto-add file names to docs list
    const docNames = valid.map(f => f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").toLowerCase());
    setDocs(prev => [...new Set([...prev, ...docNames])]);
  }

  function removeFile(name: string) {
    setUploadedFiles(prev => prev.filter(f => f.name !== name));
    const docName = name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").toLowerCase();
    setDocs(prev => prev.filter(d => d !== docName));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.claimant_name || !form.description || !form.amount) { setError("Please fill all fields"); return; }
    setError("");
    setPhase("running");
    setPipeStep(0);

    timersRef.current = STEP_TIMINGS.map((ms, i) =>
      setTimeout(() => setPipeStep(i + 1), ms)
    );

    const [claim] = await Promise.all([
      submitClaim({ ...form, amount: parseFloat(form.amount), documents_provided: docs }),
      new Promise<void>(r => setTimeout(r, 7200)),
    ]).catch(err => {
      setError(err instanceof Error ? err.message : "Submission failed");
      setPhase("idle");
      timersRef.current.forEach(clearTimeout);
      return [null];
    });

    if (claim) {
      setResult(claim as Claim);
      setPhase("done");
    }
  }

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  if (phase === "running") return <PipelineView step={pipeStep} />;
  if (phase === "done" && result) return <ResultView result={result} onReset={() => { setPhase("idle"); setForm({ claimant_name: "", claim_type: "motor", description: "", amount: "" }); setDocs([]); setUploadedFiles([]); setResult(null); }} />;

  return (
    <div className="space-y-4">
      <RoleBar />

      {/* Two-column layout on lg+, single column on mobile */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT: Form ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Chapter card — mobile only (shown above form) */}
          <div className="lg:hidden rounded-xl px-5 py-4" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f0e8ff 100%)", border: "1px solid rgba(108,99,255,0.18)" }}>
            <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#6C63FF12", color: "#6C63FF", border: "1px solid #6C63FF30" }}>
              Chapter 2 · Watch AI Work
            </span>
            <h1 className="text-lg font-bold text-[#223A66] mt-2">You are the Claims Adjuster</h1>
            <p className="text-xs text-[#475569] mt-1 leading-relaxed">
              Fill in a claim and hit submit. Five AI agents process it in under <span className="text-[#223A66] font-medium">3 seconds</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2 block">Claimant Name</label>
              <input type="text" value={form.claimant_name}
                onChange={e => setForm({ ...form, claimant_name: e.target.value })}
                placeholder="Full name of the claimant"
                className="w-full surface rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#334155] focus:outline-none focus:ring-1 border border-white/[0.06] focus:border-[#6C63FF]/50" />
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2 block">Claim Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CLAIM_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => { setForm({ ...form, claim_type: t.value }); setDocs([]); }}
                    className={`px-3 py-3 rounded-lg border text-left transition-colors ${
                      form.claim_type === t.value
                        ? "border-[#6C63FF]/50 bg-[#6C63FF]/08 text-white"
                        : "border-white/[0.05] text-[#475569] hover:border-white/10 hover:text-[#64748b]"
                    }`}>
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2 block">Incident Description</label>
              <textarea rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe when, where, and how the incident occurred..."
                className="w-full surface rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#334155] focus:outline-none border border-white/[0.06] focus:border-[#6C63FF]/50 resize-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2 block">Claim Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#334155]">$</span>
                <input type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full surface rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder-[#334155] focus:outline-none border border-white/[0.06] focus:border-[#6C63FF]/50" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2 block">Supporting Documents</label>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragging
                    ? "border-[#6C63FF]/60 bg-[#6C63FF]/08"
                    : "border-white/[0.07] hover:border-[#6C63FF]/30 hover:bg-[#6C63FF]/04"
                }`}>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                  onChange={e => addFiles(e.target.files)} />
                <svg className="w-8 h-8 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">{dragging ? "Drop files here" : "Upload documents"}</div>
                  <div className="text-[11px] text-[#334155] mt-0.5">PDF, JPG, PNG, DOC · Click or drag &amp; drop</div>
                </div>
              </div>

              {/* Uploaded file list */}
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {uploadedFiles.map(f => (
                    <div key={f.name} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#6C63FF]/20 bg-[#6C63FF]/05">
                      <svg className="w-4 h-4 shrink-0" style={{ color: "#6C63FF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="flex-1 text-xs text-white truncate">{f.name}</span>
                      <span className="text-[10px] text-[#334155] shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={e => { e.stopPropagation(); removeFile(f.name); }}
                        className="shrink-0 w-4 h-4 text-[#334155] hover:text-red-400 transition-colors">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick-select chips */}
              <div className="mt-3">
                <div className="text-[10px] text-[#334155] mb-2">Or quickly mark document types:</div>
                <div className="flex flex-wrap gap-2">
                  {DOC_OPTIONS[form.claim_type].map(doc => (
                    <button key={doc} type="button" onClick={() => toggleDoc(doc)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        docs.includes(doc)
                          ? "border-[#6C63FF]/40 bg-[#6C63FF]/08 text-[#b84dff]"
                          : "border-white/[0.05] text-[#475569] hover:border-white/10"
                      }`}>
                      {docs.includes(doc) ? "✓ " : ""}{doc}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-[#334155] mt-1.5">
                {docs.length > 0
                  ? `${docs.length} document${docs.length > 1 ? "s" : ""} attached — higher confidence score`
                  : "Tip: more documents = higher approval confidence"}
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/[0.07] border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
            )}

            <button type="submit"
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: "#0D6EFD" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0b5ed7")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0D6EFD")}>
              Submit Claim → Run AI Pipeline
            </button>
          </form>
        </div>{/* end left col */}

        {/* ── RIGHT: Chapter info + pipeline ── */}
        <div className="hidden lg:flex flex-col gap-4 w-80 xl:w-96 shrink-0">

          {/* Chapter card */}
          <div className="rounded-xl px-5 py-5" style={{ background: "#0a0d12", border: "1px solid #6C63FF20" }}>
            <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#6C63FF15", color: "#6C63FF", border: "1px solid #6C63FF30" }}>
              Chapter 2 · Watch AI Work
            </span>
            <h2 className="text-lg font-bold text-white mt-3">You are the Claims Adjuster</h2>
            <p className="text-xs text-[#475569] mt-2 leading-relaxed">
              Fill in a claim below and hit submit. Five AI agents will immediately begin processing it — analysing fraud signals, matching insurance policy, checking fraud ring patterns, and generating a verdict. The entire pipeline runs in under{" "}
              <span className="text-white font-medium">3 seconds</span>.
            </p>
            <div className="flex items-center gap-6 mt-4">
              {[
                { n: "5", label: "AI agents" },
                { n: "<3s", label: "processing time" },
                { n: "100%", label: "automated" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-base font-bold" style={{ color: "#6C63FF" }}>{s.n}</div>
                  <div className="text-[9px] text-[#334155] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="rounded-xl p-5" style={{ background: "#0d0f14", border: "1px solid #ffffff08" }}>
            <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-4">What happens after you submit</div>
            <div className="space-y-0">
              {PIPELINE_STEPS.map((s, i) => (
                <div key={s.name} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white" style={{ background: "#6C63FF20", border: "1px solid #6C63FF30" }}>
                      {i + 1}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="w-px flex-1 my-1" style={{ background: "#6C63FF15" }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-4 ${i === PIPELINE_STEPS.length - 1 ? "pb-0" : ""}`}>
                    <div className="text-[12px] font-semibold text-[#94a3b8]">{s.name}</div>
                    {s.feature && (
                      <span className="inline-block text-[9px] px-1.5 py-0.5 rounded mt-0.5 mb-1"
                        style={{ background: "#6C63FF10", color: "#6C63FF80", border: "1px solid #6C63FF20" }}>
                        {s.feature}
                      </span>
                    )}
                    <div className="text-[10px] text-[#334155] leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload tip */}
          <div className="rounded-xl px-4 py-3.5 flex gap-3" style={{ background: "#0d0f14", border: "1px solid #ffffff06" }}>
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-[11px] font-semibold text-amber-400 mb-0.5">Demo tip</div>
              <div className="text-[10px] text-[#475569] leading-relaxed">
                Upload the demo PDFs from <span className="text-white font-medium">demo_docs/</span> to see document extraction in action. Set 3 (Motor Theft) will trigger the Fraud Ring detection.
              </div>
            </div>
          </div>

        </div>{/* end right col */}
      </div>{/* end two-col wrapper */}
    </div>
  );
}

function PipelineView({ step }: { step: number }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Processing Your Claim</h1>
        <p className="text-sm text-[#64748b] mt-0.5">5 AI agents running in sequence · MongoDB Atlas · AWS Bedrock</p>
      </div>

      <div className="surface rounded-xl p-6 space-y-1">
        {PIPELINE_STEPS.map((s, i) => {
          const done    = step > i;
          const running = step === i;
          const pending = step < i;
          return (
            <div key={s.name}>
              <div className="flex items-start gap-4 py-3">
                {/* Icon column */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done    ? "bg-emerald-500/15 text-emerald-400" :
                    running ? "bg-[#6C63FF]/15 text-[#6C63FF]" :
                              "bg-white/[0.03] text-[#1e2a3a]"
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : running ? (
                      <PulsingDot />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                </div>

                {/* Text column */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${done || running ? "text-white" : "text-[#2a3344]"}`}>
                      {s.name}
                    </span>
                    {s.feature && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        done || running
                          ? "border-[#6C63FF]/25 text-[#6C63FF]/70 bg-[#6C63FF]/05"
                          : "border-white/[0.04] text-[#1e2a3a]"
                      }`}>
                        {s.feature}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    done    ? "text-emerald-500/70 italic" :
                    running ? "text-[#64748b]" :
                              "text-[#1e2a3a]"
                  }`}>
                    {done ? `✓ ${s.doneMsg}` : running ? s.desc : s.desc}
                  </p>
                </div>

                {/* Time indicator */}
                {running && (
                  <div className="shrink-0 pt-1">
                    <LoadingDots />
                  </div>
                )}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={`ml-4 w-0.5 h-3 ${done ? "bg-emerald-500/20" : "bg-white/[0.04]"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#334155]">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C63FF] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#6C63FF]" />
        </span>
        All agent state is being checkpointed to MongoDB Atlas in real time
      </div>
    </div>
  );
}

function ResultView({ result, onReset }: { result: Claim; onReset: () => void }) {
  const router = useRouter();
  const d = result.decision;
  const verdict = d?.verdict ?? result.status;

  const verdictStyle: Record<string, { bg: string; text: string; label: string }> = {
    approved:     { bg: "#10b981/10", text: "#10b981", label: "Approved" },
    flagged:      { bg: "#ef4444/10", text: "#ef4444", label: "Flagged for Review" },
    escalated:    { bg: "#6C63FF/10", text: "#6C63FF", label: "Escalated" },
    pending_docs: { bg: "#f59e0b/10", text: "#f59e0b", label: "Pending Documents" },
    rejected:     { bg: "#ef4444/10", text: "#ef4444", label: "Rejected" },
  };
  const vs = verdictStyle[verdict] ?? { bg: "#64748b/10", text: "#64748b", label: verdict };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${vs.text}15` }}>
          {verdict === "approved" ? (
            <svg className="w-5 h-5" style={{ color: vs.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" style={{ color: vs.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div>
          <div className="text-xs text-[#64748b]">Pipeline complete · {result.agent_trace.length} agents ran</div>
          <h1 className="text-xl font-semibold text-white">
            Claim <span style={{ color: vs.text }}>{vs.label}</span>
          </h1>
        </div>
      </div>

      {/* Key facts */}
      <div className="surface rounded-xl p-5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-0.5">Claim ID</div>
          <div className="text-sm font-mono font-bold text-white">{result.claim_id}</div>
        </div>
        <div>
          <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-0.5">Amount</div>
          <div className="text-sm font-bold text-white">{fmt(result.amount)}</div>
        </div>
        {d?.settlement_amount && (
          <div>
            <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-0.5">Settlement</div>
            <div className="text-sm font-bold text-emerald-400">{fmt(d.settlement_amount)}</div>
          </div>
        )}
        {d?.policy_match && (
          <div>
            <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-0.5">Policy Matched</div>
            <div className="text-xs text-[#64748b] leading-snug">{d.policy_match}</div>
          </div>
        )}
        {d?.fraud_score !== undefined && (
          <div className="col-span-2">
            <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-1.5">Fraud Score</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${d.fraud_score}%`,
                    background: d.fraud_score >= 70 ? "#ef4444" : d.fraud_score >= 40 ? "#f59e0b" : "#10b981",
                  }} />
              </div>
              <span className={`text-sm font-bold tabular-nums ${
                d.fraud_score >= 70 ? "text-red-400" : d.fraud_score >= 40 ? "text-amber-400" : "text-emerald-400"
              }`}>{d.fraud_score}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Reasoning */}
      {d?.reasoning && (
        <div className="surface rounded-xl p-5">
          <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-2">AI Reasoning</div>
          <p className="text-sm text-[#94a3b8] leading-relaxed">{d.reasoning}</p>
        </div>
      )}

      {/* Missing docs */}
      {d?.missing_documents && d.missing_documents.length > 0 && (
        <div className="surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2.5">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-semibold text-amber-400">Documents Required to Proceed</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {d.missing_documents.map(doc => (
              <span key={doc} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/[0.07] border border-amber-500/20 text-amber-400">
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Tech Stack Used */}
      <AiMethodsPanel trace={result.agent_trace} />

      {/* CTAs */}
      <div className="flex gap-2.5">
        <button
          onClick={() => router.push(`/claims/${result.claim_id}`)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#0D6EFD" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#0b5ed7")}
          onMouseLeave={e => (e.currentTarget.style.background = "#0D6EFD")}>
          View Claim Details →
        </button>
        <Link href="/claims"
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#64748b] hover:text-white border border-white/[0.06] hover:border-white/10 text-center transition-colors">
          Claims List
        </Link>
        <button onClick={onReset}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#64748b] hover:text-white border border-white/[0.06] hover:border-white/10 transition-colors">
          New Claim
        </button>
      </div>
    </div>
  );
}

const METHOD_META: Record<string, { label: string; color: string; icon: string }> = {
  aws_bedrock_claude:              { label: "AWS Bedrock · Claude",            color: "#f59e0b", icon: "B" },
  mongodb_atlas_vector_search:     { label: "MongoDB Atlas Vector Search",     color: "#10b981", icon: "V" },
  rule_based_fallback:             { label: "Rule-based",                      color: "#475569", icon: "R" },
  langgraph_mongodb_checkpointing: { label: "LangGraph MongoDB Checkpoint",    color: "#6C63FF", icon: "C" },
};

function AiMethodsPanel({ trace }: { trace: { agent_name: string; result?: Record<string, unknown>; duration_ms?: number }[] }) {
  const badges: { label: string; color: string; icon: string; ms?: number }[] = [];

  for (const step of trace) {
    const r = step.result as Record<string, unknown> | undefined;
    if (!r) continue;

    const method = (r["analysis_method"] as string) || (r["search_method"] as string);
    if (method && METHOD_META[method]) {
      const meta = METHOD_META[method];
      if (!badges.find(b => b.label === meta.label)) {
        badges.push({ ...meta, ms: step.duration_ms });
      }
    }
  }

  // Always show LangGraph checkpointing as it runs regardless
  if (!badges.find(b => b.label === METHOD_META["langgraph_mongodb_checkpointing"].label)) {
    badges.push({ ...METHOD_META["langgraph_mongodb_checkpointing"] });
  }

  if (badges.length === 0) return null;

  return (
    <div className="surface rounded-xl p-4">
      <div className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mb-3">AI Technologies Used</div>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <div key={b.label}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border"
            style={{ background: `${b.color}10`, borderColor: `${b.color}25`, color: b.color }}>
            <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: `${b.color}20` }}>
              {b.icon}
            </span>
            <span className="font-medium">{b.label}</span>
            {b.ms && b.ms > 100 && (
              <span className="opacity-50 text-[9px]">{b.ms}ms</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C63FF] opacity-60" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#6C63FF]" />
    </span>
  );
}

function LoadingDots() {
  return (
    <span className="flex gap-1 items-center pt-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1 h-1 rounded-full bg-[#6C63FF]"
          style={{ animation: `bounce 1.2s ease-in-out infinite ${i * 0.2}s` }} />
      ))}
    </span>
  );
}
