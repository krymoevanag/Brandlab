import React, { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Printer,
  Cpu,
  Filter,
} from "lucide-react";

type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "converted";

interface Quotation {
  id: string;
  customer: string;
  unit: "graphics" | "cnc";
  branch: string;
  description: string;
  amount: string;
  status: QuoteStatus;
  date: string;
  validUntil: string;
  items: number;
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; cls: string; icon: React.ElementType }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
  sent: { label: "Sent to Client", cls: "bg-sky-50 text-sky-700 border-sky-200", icon: FileText },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  converted: { label: "Converted → Job", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
};

const DEMO_QUOTES: Quotation[] = [
  { id: "QUO-2026-0088", customer: "Safaricom PLC", unit: "graphics", branch: "NBI", description: "Fleet branding vinyl wraps (20 vehicles)", amount: "KES 280,000", status: "approved", date: "17 Oct 2026", validUntil: "31 Oct 2026", items: 6 },
  { id: "QUO-2026-0087", customer: "Equity Bank Kenya", unit: "graphics", branch: "NBI", description: "Branch interior signage & wall branding", amount: "KES 145,000", status: "sent", date: "16 Oct 2026", validUntil: "30 Oct 2026", items: 8 },
  { id: "QUO-2026-0086", customer: "Apex Architects Nairobi", unit: "cnc", branch: "NBI", description: "Laser-cut brass lettering — commercial complex", amount: "KES 93,500", status: "draft", date: "15 Oct 2026", validUntil: "29 Oct 2026", items: 3 },
  { id: "QUO-2026-0085", customer: "Meru Greens Ltd", unit: "graphics", branch: "MER", description: "Event rollup banners × 12 + table runners", amount: "KES 48,000", status: "converted", date: "12 Oct 2026", validUntil: "26 Oct 2026", items: 4 },
  { id: "QUO-2026-0084", customer: "KenGen Corporate", unit: "cnc", branch: "NBI", description: "Machine guard acrylic shields (custom spec)", amount: "KES 62,000", status: "approved", date: "11 Oct 2026", validUntil: "25 Oct 2026", items: 5 },
  { id: "QUO-2026-0083", customer: "Java House Kenya", unit: "graphics", branch: "NBI", description: "Wooden corporate gift boxes with laser engraving", amount: "KES 28,000", status: "rejected", date: "8 Oct 2026", validUntil: "22 Oct 2026", items: 2 },
  { id: "QUO-2026-0082", customer: "Baraka Events Ltd", unit: "graphics", branch: "MER", description: "Event backdrop + step-and-repeat stands", amount: "KES 72,000", status: "sent", date: "6 Oct 2026", validUntil: "20 Oct 2026", items: 3 },
];

const PIPELINE_STAGES: { status: QuoteStatus; label: string; color: string }[] = [
  { status: "draft", label: "Drafts", color: "bg-slate-400" },
  { status: "sent", label: "Sent", color: "bg-sky-500" },
  { status: "approved", label: "Approved", color: "bg-emerald-500" },
  { status: "converted", label: "Converted", color: "bg-blue-600" },
  { status: "rejected", label: "Rejected", color: "bg-rose-500" },
];

export const QuotationsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [unitFilter, setUnitFilter] = useState<"all" | "graphics" | "cnc">("all");

  const filtered = DEMO_QUOTES.filter((q) => {
    const qs = search.toLowerCase();
    const matchSearch = !qs || q.customer.toLowerCase().includes(qs) || q.id.toLowerCase().includes(qs) || q.description.toLowerCase().includes(qs);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    const matchUnit = unitFilter === "all" || q.unit === unitFilter;
    return matchSearch && matchStatus && matchUnit;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-action" />
            Orders & Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {DEMO_QUOTES.length} quotations · {DEMO_QUOTES.filter((q) => q.status === "approved").length} approved
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-xs font-semibold shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-5 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const count = DEMO_QUOTES.filter((q) => q.status === stage.status).length;
          return (
            <button
              key={stage.status}
              onClick={() => setStatusFilter(stage.status === statusFilter ? "all" : stage.status)}
              className={`bg-white rounded-card border p-3 text-center shadow-card hover:shadow-cardHover transition-all ${
                statusFilter === stage.status ? "border-brand-action ring-2 ring-brand-action/20" : "border-slate-200/90"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${stage.color} mx-auto mb-2`} />
              <p className="text-lg font-bold text-slate-900">{count}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{stage.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-card border border-slate-200/90 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, quote ID, or description..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-btn text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs">
            {(["all", "graphics", "cnc"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnitFilter(u)}
                className={`flex items-center gap-1 px-2.5 py-1.5 font-medium capitalize transition-colors ${
                  unitFilter === u ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {u === "graphics" && <Printer className="w-3 h-3" />}
                {u === "cnc" && <Cpu className="w-3 h-3" />}
                {u === "all" ? "All Units" : u === "graphics" ? "Graphics" : "CNC"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Business Unit</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((q) => {
                const cfg = STATUS_CONFIG[q.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors group cursor-pointer">
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-navy">{q.id}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.unit === "graphics" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-orange-50 text-orange-700 border-orange-200"
                      }`}>
                        {q.unit === "graphics" ? <Printer className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                        {q.unit === "graphics" ? "Graphics" : "CNC"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{q.customer}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[220px] truncate">{q.description}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">{q.items}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{q.validUntil}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{q.amount}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${cfg.cls}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-action transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No quotations match your search</p>
          </div>
        )}
      </div>
    </div>
  );
};
