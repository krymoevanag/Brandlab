import React, { useState } from "react";
import { ShieldCheck, Search, Eye, Filter } from "lucide-react";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "APPROVE" | "REJECT" | "STATUS_CHANGE";

interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  branch: string;
  ipAddress: string;
  summary: string;
}

const ACTION_CONFIG: Record<AuditAction, { cls: string; label: string }> = {
  CREATE: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Create" },
  UPDATE: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Update" },
  DELETE: { cls: "bg-rose-50 text-rose-700 border-rose-200", label: "Delete" },
  LOGIN: { cls: "bg-sky-50 text-sky-700 border-sky-200", label: "Login" },
  LOGOUT: { cls: "bg-slate-100 text-slate-700 border-slate-200", label: "Logout" },
  APPROVE: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Approve" },
  REJECT: { cls: "bg-rose-50 text-rose-700 border-rose-200", label: "Reject" },
  STATUS_CHANGE: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Status Δ" },
};

const DEMO_AUDIT: AuditEntry[] = [
  { id: 101, timestamp: "2026-10-19 10:42:08", user: "owner@atozgraphics.co.ke", role: "Owner", action: "APPROVE", entity: "Expense", entityId: "EXP-0039", branch: "NBI", ipAddress: "192.168.1.10", summary: "Approved electricity bill expense KES 14,800" },
  { id: 100, timestamp: "2026-10-19 09:31:55", user: "mgr.nbi@atozgraphics.co.ke", role: "Branch Manager", action: "STATUS_CHANGE", entity: "Job", entityId: "NBI-JOB-2026-0042", branch: "NBI", ipAddress: "192.168.1.14", summary: "Job status changed: design_approved → in_production" },
  { id: 99, timestamp: "2026-10-19 09:15:22", user: "sales.nbi@atozgraphics.co.ke", role: "Sales Attendant", action: "CREATE", entity: "Quotation", entityId: "QUO-2026-0088", branch: "NBI", ipAddress: "192.168.1.21", summary: "Created new quotation for Safaricom PLC — KES 280,000" },
  { id: 98, timestamp: "2026-10-18 16:47:11", user: "designer@atozgraphics.co.ke", role: "Designer", action: "UPDATE", entity: "Job", entityId: "NBI-JOB-2026-0043", branch: "NBI", ipAddress: "192.168.1.18", summary: "Design proof uploaded and approved by designer" },
  { id: 97, timestamp: "2026-10-18 15:30:00", user: "owner@atozgraphics.co.ke", role: "Owner", action: "CREATE", entity: "User", entityId: "USR-015", branch: "NBI", ipAddress: "192.168.1.10", summary: "New staff account created: alice.nbi@atozgraphics.co.ke (Sales)" },
  { id: 96, timestamp: "2026-10-18 14:10:43", user: "mgr.mer@atozgraphics.co.ke", role: "Branch Manager", action: "APPROVE", entity: "Expense", entityId: "EXP-0038", branch: "MER", ipAddress: "10.0.0.5", summary: "Approved transport expense KES 8,600 (Meru–Nairobi)" },
  { id: 95, timestamp: "2026-10-18 11:55:02", user: "sales.mer@atozgraphics.co.ke", role: "Sales Attendant", action: "CREATE", entity: "Customer", entityId: "CUST-048", branch: "MER", ipAddress: "10.0.0.12", summary: "Registered new customer: Meru Greens Ltd (Corporate)" },
  { id: 94, timestamp: "2026-10-17 17:00:00", user: "owner@atozgraphics.co.ke", role: "Owner", action: "LOGIN", entity: "Session", entityId: "SES-201", branch: "NBI", ipAddress: "192.168.1.10", summary: "Owner logged in — session started" },
  { id: 93, timestamp: "2026-10-17 14:22:30", user: "mgr.nbi@atozgraphics.co.ke", role: "Branch Manager", action: "REJECT", entity: "Expense", entityId: "EXP-0036", branch: "NBI", ipAddress: "192.168.1.14", summary: "Rejected office stationery expense — insufficient documentation" },
  { id: 92, timestamp: "2026-10-17 11:03:14", user: "sales.nbi@atozgraphics.co.ke", role: "Sales Attendant", action: "UPDATE", entity: "Customer", entityId: "CUST-001", branch: "NBI", ipAddress: "192.168.1.21", summary: "Updated customer contact: Safaricom PLC — new email address" },
];

export const AuditPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");

  const filtered = DEMO_AUDIT.filter((a) => {
    const qs = search.toLowerCase();
    const matchSearch = !qs || a.user.toLowerCase().includes(qs) || a.entity.toLowerCase().includes(qs) || a.entityId.toLowerCase().includes(qs) || a.summary.toLowerCase().includes(qs);
    const matchAction = actionFilter === "all" || a.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-action" />
          Audit Log
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable record of all system actions · {DEMO_AUDIT.length} entries
        </p>
      </div>

      {/* Action Summary */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {(["all", "CREATE", "UPDATE", "STATUS_CHANGE", "APPROVE", "REJECT", "LOGIN", "DELETE"] as const).map((a) => {
          const count = a === "all" ? DEMO_AUDIT.length : DEMO_AUDIT.filter((e) => e.action === a).length;
          const cfg = a === "all" ? null : ACTION_CONFIG[a as AuditAction];
          return (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`rounded-card border p-2 text-center shadow-card hover:shadow-cardHover transition-all ${
                actionFilter === a ? "border-brand-action ring-2 ring-brand-action/20" : "border-slate-200/90 bg-white"
              }`}
            >
              <p className="text-sm font-bold text-slate-900">{count}</p>
              <p className="text-[9px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
                {a === "all" ? "All" : ACTION_CONFIG[a as AuditAction].label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, entity, or summary..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-btn text-xs shadow-card text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
          />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-btn text-[11px] text-amber-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Append-only · Tamper-proof ledger
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((entry) => {
                const ac = ACTION_CONFIG[entry.action];
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{entry.id}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">{entry.timestamp}</td>
                    <td className="py-3 px-4 text-[11px] font-semibold text-brand-navy truncate max-w-[160px]">{entry.user}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{entry.role}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${ac.cls}`}>
                        {ac.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-800">{entry.entity}</span>
                      <span className="font-mono text-[9px] text-slate-400 ml-1">#{entry.entityId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{entry.branch}</span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600 max-w-[250px] truncate">{entry.summary}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{entry.ipAddress}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No audit entries match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
