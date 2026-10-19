import React, { useState } from "react";
import {
  Wallet,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  Banknote,
  Fuel,
  Wrench,
  ShoppingBag,
  Filter,
} from "lucide-react";

type ExpenseStatus = "pending" | "approved" | "rejected";
type ExpenseCategory = "materials" | "utilities" | "transport" | "maintenance" | "salaries" | "office" | "other";

interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  branch: string;
  unit: "graphics" | "cnc" | "shared";
  date: string;
  submittedBy: string;
  approvedBy?: string;
  status: ExpenseStatus;
  receiptRef?: string;
}

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending: { label: "Pending Approval", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
};

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: React.ElementType; color: string }> = {
  materials: { label: "Materials & Stock", icon: ShoppingBag, color: "text-blue-700 bg-blue-50" },
  utilities: { label: "Utilities", icon: Fuel, color: "text-amber-700 bg-amber-50" },
  transport: { label: "Transport", icon: Fuel, color: "text-sky-700 bg-sky-50" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "text-orange-700 bg-orange-50" },
  salaries: { label: "Salaries", icon: Banknote, color: "text-emerald-700 bg-emerald-50" },
  office: { label: "Office & Admin", icon: Receipt, color: "text-purple-700 bg-purple-50" },
  other: { label: "Other", icon: Wallet, color: "text-slate-700 bg-slate-100" },
};

const DEMO_EXPENSES: Expense[] = [
  { id: "EXP-0041", description: "Vinyl substrate rolls — 3M Premium glossy (50m × 2)", category: "materials", amount: 32400, branch: "NBI", unit: "graphics", date: "19 Oct 2026", submittedBy: "John M.", status: "pending" },
  { id: "EXP-0040", description: "CNC machine tool bits replacement (12 pcs)", category: "maintenance", amount: 18500, branch: "NBI", unit: "cnc", date: "18 Oct 2026", submittedBy: "Sarah K.", status: "pending" },
  { id: "EXP-0039", description: "Nairobi branch electricity bill — October 2026", category: "utilities", amount: 14800, branch: "NBI", unit: "shared", date: "17 Oct 2026", submittedBy: "Jane W.", approvedBy: "Mgr. Eric O.", status: "approved" },
  { id: "EXP-0038", description: "Delivery van fuel — Meru–Nairobi run", category: "transport", amount: 8600, branch: "MER", unit: "shared", date: "16 Oct 2026", submittedBy: "Tom W.", approvedBy: "Mgr. Beatrice K.", status: "approved" },
  { id: "EXP-0037", description: "Acrylic sheet stock top-up — 6mm clear (20 sheets)", category: "materials", amount: 24000, branch: "NBI", unit: "cnc", date: "15 Oct 2026", submittedBy: "Sarah K.", approvedBy: "Mgr. Eric O.", status: "approved" },
  { id: "EXP-0036", description: "Office stationery & printing paper", category: "office", amount: 3200, branch: "MER", unit: "shared", date: "14 Oct 2026", submittedBy: "Alice N.", status: "rejected" },
];

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

export const ExpensesPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "all">("all");

  const pendingTotal = DEMO_EXPENSES.filter((e) => e.status === "pending").reduce((a, e) => a + e.amount, 0);
  const approvedTotal = DEMO_EXPENSES.filter((e) => e.status === "approved").reduce((a, e) => a + e.amount, 0);
  const pendingCount = DEMO_EXPENSES.filter((e) => e.status === "pending").length;

  const filtered = DEMO_EXPENSES.filter((e) => {
    const qs = search.toLowerCase();
    const matchSearch = !qs || e.description.toLowerCase().includes(qs) || e.id.toLowerCase().includes(qs) || e.submittedBy.toLowerCase().includes(qs);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-action" />
            Expenses Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {DEMO_EXPENSES.length} expenses ·
            <span className="text-amber-700 font-semibold ml-1">{pendingCount} pending approval</span>
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-xs font-semibold shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-card border border-amber-200 shadow-card p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </p>
          <p className="text-xl font-bold text-amber-800">{fmt(pendingTotal)}</p>
          <p className="text-[11px] text-amber-600 mt-1">{pendingCount} items require approval</p>
        </div>
        <div className="bg-white rounded-card border border-emerald-200 shadow-card p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved (Month)
          </p>
          <p className="text-xl font-bold text-emerald-800">{fmt(approvedTotal)}</p>
          <p className="text-[11px] text-emerald-600 mt-1">{DEMO_EXPENSES.filter((e) => e.status === "approved").length} approved expenses</p>
        </div>
        <div className="bg-white rounded-card border border-slate-200/90 shadow-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Recorded</p>
          <p className="text-xl font-bold text-slate-900">{fmt(pendingTotal + approvedTotal)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Both branches · this month</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-card p-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">By Category</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const CatIcon = cfg.icon;
            const total = DEMO_EXPENSES.filter((e) => e.category === cat).reduce((a, e) => a + e.amount, 0);
            if (!total) return null;
            return (
              <div key={cat} className={`flex items-center gap-2 px-3 py-1.5 rounded-btn text-xs font-semibold ${cfg.color}`}>
                <CatIcon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
                <span className="font-bold opacity-80">{fmt(total)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description, ref, or submitted by..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-btn text-xs shadow-card text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs bg-white shadow-card">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 font-medium capitalize transition-colors ${
                  statusFilter === s ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s === "all" ? "All" : STATUS_CONFIG[s]?.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Branch · Unit</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Approved By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((exp) => {
                const sc = STATUS_CONFIG[exp.status];
                const cc = CATEGORY_CONFIG[exp.category];
                const SIcon = sc.icon;
                const CIcon = cc.icon;
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">{exp.id}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-btn text-[10px] font-semibold ${cc.color}`}>
                        <CIcon className="w-2.5 h-2.5" />
                        {cc.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[200px] truncate">{exp.description}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] text-slate-500 font-semibold">{exp.branch}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className={`text-[10px] font-semibold ${exp.unit === "graphics" ? "text-sky-700" : exp.unit === "cnc" ? "text-orange-700" : "text-slate-500"}`}>
                        {exp.unit === "shared" ? "Shared" : exp.unit === "graphics" ? "Graphics" : "CNC"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{exp.date}</td>
                    <td className="py-3.5 px-4 text-slate-600">{exp.submittedBy}</td>
                    <td className="py-3.5 px-4 text-slate-500">{exp.approvedBy || "—"}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{fmt(exp.amount)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${sc.cls}`}>
                        <SIcon className="w-2.5 h-2.5" />
                        {exp.status === "pending" ? "Pending" : exp.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
