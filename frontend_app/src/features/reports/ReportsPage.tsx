import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Cpu,
  Calendar,
  DollarSign,
  Target,
  Activity,
} from "lucide-react";

type ReportPeriod = "week" | "month" | "quarter" | "year";

interface BranchStat {
  branch: string;
  revenue: number;
  expenses: number;
  jobs: number;
  customers: number;
  profit: number;
}

const BRANCH_STATS: Record<"NBI" | "MER", BranchStat> = {
  NBI: { branch: "Nairobi", revenue: 680000, expenses: 210000, jobs: 32, customers: 48, profit: 470000 },
  MER: { branch: "Meru", expenses: 67000, revenue: 190000, jobs: 12, customers: 19, profit: 123000 },
};

const UNIT_BREAKDOWN = [
  { unit: "Graphics & Branding", revenue: 528000, jobs: 28, avgJob: "KES 18,857", color: "bg-sky-500", pct: 62 },
  { unit: "CNC Services", revenue: 342000, jobs: 16, avgJob: "KES 21,375", color: "bg-orange-500", pct: 38 },
];

const MONTHLY_TREND = [
  { month: "May", graphics: 320000, cnc: 180000 },
  { month: "Jun", graphics: 390000, cnc: 210000 },
  { month: "Jul", graphics: 450000, cnc: 240000 },
  { month: "Aug", graphics: 410000, cnc: 195000 },
  { month: "Sep", graphics: 510000, cnc: 300000 },
  { month: "Oct", graphics: 528000, cnc: 342000 },
];

const MAX_REVENUE = Math.max(...MONTHLY_TREND.map((m) => m.graphics + m.cnc));

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [branchFilter, setBranchFilter] = useState<"all" | "NBI" | "MER">("all");

  const totalRevenue = (branchFilter === "all" ? BRANCH_STATS.NBI.revenue + BRANCH_STATS.MER.revenue : BRANCH_STATS[branchFilter].revenue);
  const totalExpenses = (branchFilter === "all" ? BRANCH_STATS.NBI.expenses + BRANCH_STATS.MER.expenses : BRANCH_STATS[branchFilter].expenses);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = Math.round((totalProfit / totalRevenue) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-action" />
            Financial & Operations Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Consolidated performance overview · Both business units</p>
        </div>
        <div className="flex gap-2">
          {/* Period Selector */}
          <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs bg-white shadow-card">
            {(["week", "month", "quarter", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1.5 font-medium capitalize transition-colors ${
                  period === p ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Branch Selector */}
          <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs bg-white shadow-card">
            {(["all", "NBI", "MER"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBranchFilter(b)}
                className={`px-2.5 py-1.5 font-medium transition-colors ${
                  branchFilter === b ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {b === "all" ? "All Branches" : b}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-btn text-xs font-medium text-slate-700 shadow-card hover:bg-slate-50 transition-all">
            <Download className="w-3.5 h-3.5 text-brand-action" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: fmt(totalRevenue), change: "+14.2%", positive: true, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Expenses", value: fmt(totalExpenses), change: "+8.1%", positive: false, icon: TrendingDown, color: "text-rose-600 bg-rose-50" },
          { label: "Net Profit", value: fmt(totalProfit), change: `${profitMargin}% margin`, positive: true, icon: DollarSign, color: "text-blue-600 bg-blue-50" },
          { label: "Active Customers", value: String(branchFilter === "all" ? BRANCH_STATS.NBI.customers + BRANCH_STATS.MER.customers : BRANCH_STATS[branchFilter].customers), change: "+3 this month", positive: true, icon: Activity, color: "text-purple-600 bg-purple-50" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-card border border-slate-200/90 shadow-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-1.5 rounded-btn ${kpi.color}`}>
                  <KpiIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
              <p className={`text-[11px] font-medium mt-1 ${kpi.positive ? "text-emerald-600" : "text-rose-600"}`}>
                {kpi.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Two Column: Bar Chart + Branch Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart (manual bar chart) */}
        <div className="lg:col-span-2 bg-white rounded-card border border-slate-200/90 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Trend — 6 Months</h3>
              <p className="text-xs text-slate-500">Graphics vs CNC Services</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sky-500 inline-block" /> Graphics</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> CNC</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {MONTHLY_TREND.map((m) => {
              const total = m.graphics + m.cnc;
              const gPct = (m.graphics / MAX_REVENUE) * 100;
              const cPct = (m.cnc / MAX_REVENUE) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: "120px" }}>
                    <div className="w-full bg-sky-400 rounded-t-sm transition-all" style={{ height: `${gPct}%` }} title={fmt(m.graphics)} />
                    <div className="w-full bg-orange-400 rounded-t-sm transition-all" style={{ height: `${cPct}%` }} title={fmt(m.cnc)} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch Breakdown */}
        <div className="bg-white rounded-card border border-slate-200/90 shadow-card p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Branch Performance</h3>
          {(Object.entries(BRANCH_STATS) as [string, BranchStat][]).map(([code, stat]) => (
            <div key={code} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">{stat.branch} ({code})</span>
                <span className="text-xs font-bold text-emerald-700">{fmt(stat.revenue)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-brand-action to-sky-400"
                  style={{ width: `${(stat.revenue / (BRANCH_STATS.NBI.revenue + BRANCH_STATS.MER.revenue)) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Jobs</p>
                  <p className="text-xs font-bold text-slate-800">{stat.jobs}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Customers</p>
                  <p className="text-xs font-bold text-slate-800">{stat.customers}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Profit</p>
                  <p className="text-xs font-bold text-emerald-700">{fmt(stat.profit)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business Unit Breakdown */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Business Unit Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {UNIT_BREAKDOWN.map((unit) => (
            <div key={unit.unit}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {unit.unit.includes("CNC") ? <Cpu className="w-4 h-4 text-orange-600" /> : <Printer className="w-4 h-4 text-sky-600" />}
                  <span className="text-sm font-bold text-slate-900">{unit.unit}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">{unit.pct}% of revenue</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                <div className={`h-3 rounded-full ${unit.color}`} style={{ width: `${unit.pct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-50 rounded-btn p-2">
                  <p className="text-[10px] text-slate-400 font-medium">Revenue</p>
                  <p className="text-xs font-bold text-slate-900">{fmt(unit.revenue)}</p>
                </div>
                <div className="text-center bg-slate-50 rounded-btn p-2">
                  <p className="text-[10px] text-slate-400 font-medium">Jobs Done</p>
                  <p className="text-xs font-bold text-slate-900">{unit.jobs}</p>
                </div>
                <div className="text-center bg-slate-50 rounded-btn p-2">
                  <p className="text-[10px] text-slate-400 font-medium">Avg. Job</p>
                  <p className="text-xs font-bold text-slate-900">{unit.avgJob}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Top Customers by Revenue</h3>
          <span className="text-xs text-slate-400">This month</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4 text-left">#</th>
              <th className="py-2.5 px-4 text-left">Customer</th>
              <th className="py-2.5 px-4 text-left">Branch</th>
              <th className="py-2.5 px-4 text-right">Revenue</th>
              <th className="py-2.5 px-4 text-center">Jobs</th>
              <th className="py-2.5 px-4 text-left">Revenue Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { rank: 1, name: "Safaricom PLC", branch: "NBI", revenue: 280000, jobs: 3, share: 32 },
              { rank: 2, name: "Equity Bank Kenya", branch: "NBI", revenue: 145000, jobs: 2, share: 17 },
              { rank: 3, name: "KenGen Corporate", branch: "NBI", revenue: 93500, jobs: 2, share: 11 },
              { rank: 4, name: "Apex Architects", branch: "NBI", revenue: 88500, jobs: 1, share: 10 },
              { rank: 5, name: "Baraka Events Ltd", branch: "MER", revenue: 72000, jobs: 2, share: 8 },
            ].map((c) => (
              <tr key={c.rank} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-400">#{c.rank}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{c.branch}</span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-emerald-700">{fmt(c.revenue)}</td>
                <td className="py-3 px-4 text-center font-semibold text-slate-700">{c.jobs}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-brand-action" style={{ width: `${c.share}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold w-8 text-right">{c.share}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
