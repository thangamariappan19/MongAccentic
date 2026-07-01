import type { Verdict } from "@/lib/api";

const config: Record<string, { label: string; className: string }> = {
  approved:     { label: "Approved",     className: "bg-green-500/15  text-green-400  border-green-500/30"  },
  flagged:      { label: "Flagged",      className: "bg-red-500/15    text-red-400    border-red-500/30"    },
  escalated:    { label: "Escalated",    className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  pending_docs: { label: "Pending Docs", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  processing:   { label: "Processing",   className: "bg-blue-500/15   text-blue-400   border-blue-500/30"   },
  rejected:     { label: "Rejected",     className: "bg-gray-500/15   text-gray-400   border-gray-500/30"   },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? { label: status, className: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.className}`}>
      {c.label}
    </span>
  );
}
