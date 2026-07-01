"use client";
import { usePathname } from "next/navigation";
import { useRole, ROLE_CONTEXT, ROLE_COLORS, ROLE_LABELS } from "@/lib/useRole";

export default function RoleBar() {
  const role = useRole();
  const path = usePathname();

  const ctx = ROLE_CONTEXT[role]?.[path] ?? ROLE_CONTEXT[role]?.["/" ];
  if (!ctx) return null;

  const color = ROLE_COLORS[role];

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg mb-5 text-xs"
      style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-semibold shrink-0" style={{ color }}>{ROLE_LABELS[role]}</span>
      <span className="text-[#2a3344] shrink-0">·</span>
      <span className="text-[#475569]">{ctx.action}</span>
    </div>
  );
}
