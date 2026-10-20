import React, { useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";

type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue";
type PaymentMethod = "cash" | "mpesa" | "bank_transfer" | "cheque";

interface Invoice {
  id: string;
  customer: string;
  branch: string;
  total: number;
  paid: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  jobRef: string;
}

interface Payment {
  id: string;
  invoiceRef: string;
  customer: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: string;
  collectedBy: string;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; cls: string; icon: React.ElementType }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
  issued: { label: "Issued", cls: "bg-sky-50 text-sky-700 border-sky-200", icon: Receipt },
  partially_paid: { label: "Partial", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
  paid: { label: "Paid in Full", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  overdue: { label: "Overdue", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertCircle },
};

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType; color: string }> = {
  cash: { label: "Cash", icon: Banknote, color: "text-emerald-700" },
  mpesa: { label: "M-Pesa", icon: Smartphone, color: "text-green-700" },
  bank_transfer: { label: "Bank Transfer", icon: CreditCard, color: "text-blue-700" },
  cheque: { label: "Cheque", icon: Receipt, color: "text-slate-700" },
};

const DEMO_INVOICES: Invoice[] = [
  { id: "INV-2026-0056", customer: "Safaricom PLC", branch: "NBI", total: 145000, paid: 145000, status: "paid", issuedDate: "14 Oct 2026", dueDate: "28 Oct 2026", jobRef: "AZNr-JOB-2026-0040" },
  { id: "INV-2026-0057", customer: "Apex Architects", branch: "NBI", total: 88500, paid: 50000, status: "partially_paid", issuedDate: "15 Oct 2026", dueDate: "29 Oct 2026", jobRef: "AZNr-JOB-2026-0041" },
  { id: "INV-2026-0058", customer: "KenGen Corporate", branch: "NBI", total: 62000, paid: 0, status: "issued", issuedDate: "17 Oct 2026", dueDate: "31 Oct 2026", jobRef: "AZNr-JOB-2026-0044" },
  { id: "INV-2026-0059", customer: "Meru Greens Ltd", branch: "MER", total: 34000, paid: 34000, status: "paid", issuedDate: "12 Oct 2026", dueDate: "26 Oct 2026", jobRef: "AZMr-JOB-2026-0019" },
  { id: "INV-2026-0055", customer: "Baraka Events Ltd", branch: "MER", total: 72000, paid: 0, status: "overdue", issuedDate: "5 Oct 2026", dueDate: "19 Oct 2026", jobRef: "AZMr-JOB-2026-0017" },
  { id: "INV-2026-0060", customer: "Java House Kenya", branch: "NBI", total: 28000, paid: 0, status: "draft", issuedDate: "19 Oct 2026", dueDate: "2 Nov 2026", jobRef: "AZNr-JOB-2026-0045" },
];

const DEMO_PAYMENTS: Payment[] = [
  { id: "PAY-001", invoiceRef: "INV-2026-0056", customer: "Safaricom PLC", amount: 145000, method: "bank_transfer", reference: "SAFKE2026101401", date: "14 Oct 2026", collectedBy: "Jane W." },
  { id: "PAY-002", invoiceRef: "INV-2026-0057", customer: "Apex Architects", amount: 50000, method: "mpesa", reference: "MPESA1234ABC", date: "17 Oct 2026", collectedBy: "John M." },
  { id: "PAY-003", invoiceRef: "INV-2026-0059", customer: "Meru Greens Ltd", amount: 34000, method: "cash", reference: "—", date: "13 Oct 2026", collectedBy: "Alice N." },
];

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

export const InvoicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");

  const totalOutstanding = DEMO_INVOICES
    .filter((i) => i.status !== "paid")
    .reduce((acc, i) => acc + (i.total - i.paid), 0);
  const totalCollected = DEMO_PAYMENTS.reduce((acc, p) => acc + p.amount, 0);
  const overdueCount = DEMO_INVOICES.filter((i) => i.status === "overdue").length;

  const filteredInvoices = DEMO_INVOICES.filter((inv) => {
    const qs = search.toLowerCase();
    const matchSearch = !qs || inv.customer.toLowerCase().includes(qs) || inv.id.toLowerCase().includes(qs);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-action" />
            Invoices & Payments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {DEMO_INVOICES.length} invoices ·
            <span className="text-rose-700 font-semibold ml-1">{overdueCount} overdue</span>
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-xs font-semibold shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-card border border-slate-200/90 shadow-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Outstanding Balance</p>
          <p className="text-xl font-bold text-rose-700">{fmt(totalOutstanding)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{DEMO_INVOICES.filter((i) => i.status !== "paid" && i.status !== "draft").length} unpaid invoices</p>
        </div>
        <div className="bg-white rounded-card border border-slate-200/90 shadow-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Collected This Month</p>
          <p className="text-xl font-bold text-emerald-700">{fmt(totalCollected)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{DEMO_PAYMENTS.length} payment transactions</p>
        </div>
        <div className="bg-white rounded-card border border-slate-200/90 shadow-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Overdue Invoices</p>
          <p className="text-xl font-bold text-amber-700">{overdueCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Require immediate follow-up</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-btn w-fit">
        <button onClick={() => setActiveTab("invoices")} className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === "invoices" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>
          Invoices
        </button>
        <button onClick={() => setActiveTab("payments")} className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === "payments" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>
          Payment Ledger
        </button>
      </div>

      {activeTab === "invoices" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or invoice number..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-btn text-xs shadow-card text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
              />
            </div>
            <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs bg-white shadow-card">
              {(["all", "issued", "partially_paid", "paid", "overdue"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 font-medium capitalize transition-colors whitespace-nowrap ${
                    statusFilter === s ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s === "partially_paid" ? "Partial" : s === "all" ? "All" : STATUS_CONFIG[s as InvoiceStatus]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice Table */}
          <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Job Ref</th>
                    <th className="py-3 px-4">Issued</th>
                    <th className="py-3 px-4">Due</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInvoices.map((inv) => {
                    const cfg = STATUS_CONFIG[inv.status];
                    const StatusIcon = cfg.icon;
                    const balance = inv.total - inv.paid;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors group cursor-pointer">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">{inv.id}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.customer}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{inv.jobRef}</td>
                        <td className="py-3.5 px-4 text-slate-500">{inv.issuedDate}</td>
                        <td className={`py-3.5 px-4 font-medium ${inv.status === "overdue" ? "text-rose-700" : "text-slate-500"}`}>{inv.dueDate}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{fmt(inv.total)}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">{fmt(inv.paid)}</td>
                        <td className={`py-3.5 px-4 text-right font-bold ${balance > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                          {balance > 0 ? fmt(balance) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${cfg.cls}`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button title="Download PDF" className="p-1 text-slate-400 hover:text-brand-action transition-colors">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-action transition-colors" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "payments" && (
        <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Payment Ledger</h3>
            <p className="text-xs text-slate-500">All recorded payment transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Collected By</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEMO_PAYMENTS.map((p) => {
                  const mc = PAYMENT_METHOD_CONFIG[p.method];
                  const MIcon = mc.icon;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">{p.id}</td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{p.invoiceRef}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.customer}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${mc.color}`}>
                          <MIcon className="w-3.5 h-3.5" />
                          {mc.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{p.reference}</td>
                      <td className="py-3.5 px-4 text-slate-500">{p.date}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.collectedBy}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">{fmt(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
