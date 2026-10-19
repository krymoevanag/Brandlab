import React, { useState } from "react";
import type { BusinessUnit } from "../../types/business";
import { BUSINESS_UNITS } from "../../types/business";
import { BrandHeader } from "../../components/branding/BrandHeader";
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Cpu,
  Printer,
  Plus,
  Calendar,
} from "lucide-react";

interface DashboardPageProps {
  businessUnit: BusinessUnit;
  onBusinessUnitChange?: (unit: BusinessUnit) => void;
  branchCode: string;
  userRole?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  businessUnit,
  branchCode,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "completed">("all");

  const orders = [
    {
      id: "NBI-JOB-2026-0042",
      customer: "Safaricom PLC",
      unit: "graphics",
      description: "Fleet Branding & Reflective Vinyl Wraps",
      amount: "KES 145,000",
      status: "in_production",
      statusLabel: "In Production",
      dueDate: "Tomorrow, 4:00 PM",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "NBI-JOB-2026-0043",
      customer: "Apex Architects Nairobi",
      unit: "cnc",
      description: "Brass Architectural Lettering & 3D Router Cutting",
      amount: "KES 88,500",
      status: "quality_check",
      statusLabel: "Quality Check",
      dueDate: "21 Oct 2026",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      id: "MER-JOB-2026-0019",
      customer: "Meru Greens Ltd",
      unit: "graphics",
      description: "Rollup Banners & UV Flatbed Signage",
      amount: "KES 34,000",
      status: "ready_for_delivery",
      statusLabel: "Ready for Delivery",
      dueDate: "22 Oct 2026",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      id: "NBI-JOB-2026-0044",
      customer: "KenGen Corporate Office",
      unit: "cnc",
      description: "Acrylic Machine Guard Shields & Laser Engraving",
      amount: "KES 62,000",
      status: "design_approved",
      statusLabel: "Design Approved",
      dueDate: "24 Oct 2026",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      id: "NBI-JOB-2026-0045",
      customer: "Java House Kenya",
      unit: "graphics",
      description: "Custom Engraved Wooden Coasters & Gift Boxes",
      amount: "KES 28,000",
      status: "pending_deposit",
      statusLabel: "Pending Deposit",
      dueDate: "25 Oct 2026",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    },
  ];

  // Filter orders by active business unit
  const filteredOrders = orders.filter((o) => {
    if (businessUnit === "all") return true;
    return o.unit === businessUnit;
  });

  return (
    <div className="space-y-6">
      {/* 1. Contextual Brand Header */}
      <BrandHeader
        businessUnit={businessUnit}
        branchName={branchCode === "NBI" ? "Nairobi Head Office" : "Meru Regional Branch"}
        branchCode={branchCode}
      />

      {/* 2. Key Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue / Collections */}
        <div className="bg-white p-5 rounded-card border border-slate-200/90 shadow-card hover:shadow-cardHover transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {businessUnit === "cnc" ? "CNC Revenue" : businessUnit === "graphics" ? "Graphics Revenue" : "Total Collections"}
            </span>
            <div className="p-2 rounded-btn bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-slate-900">
              {businessUnit === "cnc" ? "KES 342,000" : businessUnit === "graphics" ? "KES 528,000" : "KES 870,000"}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>↑ +14.2%</span> <span className="text-slate-400">vs last month</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Active Orders / Machine Time */}
        <div className="bg-white p-5 rounded-card border border-slate-200/90 shadow-card hover:shadow-cardHover transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {businessUnit === "cnc" ? "Active CNC Jobs" : businessUnit === "graphics" ? "Print & Design Jobs" : "Jobs in Progress"}
            </span>
            <div className={`p-2 rounded-btn ${businessUnit === "cnc" ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600"}`}>
              {businessUnit === "cnc" ? <Cpu className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-slate-900">
              {businessUnit === "cnc" ? "8 Active Cut Runs" : businessUnit === "graphics" ? "14 Print Jobs" : "22 Total Jobs"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {businessUnit === "cnc" ? "3 Machines Running · 0 Downtime" : "6 Awaiting Approval · 8 In Press"}
            </p>
          </div>
        </div>

        {/* Metric 3: Expenses Recorded */}
        <div className="bg-white p-5 rounded-card border border-slate-200/90 shadow-card hover:shadow-cardHover transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Month Expenses
            </span>
            <div className="p-2 rounded-btn bg-amber-50 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-slate-900">
              {businessUnit === "cnc" ? "KES 112,400" : businessUnit === "graphics" ? "KES 164,800" : "KES 277,200"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              3 Pending Manager Approval
            </p>
          </div>
        </div>

        {/* Metric 4: Outstanding Invoice Balance */}
        <div className="bg-white p-5 rounded-card border border-slate-200/90 shadow-card hover:shadow-cardHover transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Balances
            </span>
            <div className="p-2 rounded-btn bg-blue-50 text-brand-action">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-slate-900">
              KES 194,500
            </h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              5 Invoices due this week
            </p>
          </div>
        </div>
      </div>

      {/* 3. Operational Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-card border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Quick Actions:</span>
          <span className="text-xs text-slate-500">Fast entry for daily front-desk & floor operations</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-xs font-semibold shadow-sm transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-btn text-xs font-medium shadow-sm transition-all">
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            <span>Graphics Job Card</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-btn text-xs font-medium shadow-sm transition-all">
            <Cpu className="w-3.5 h-3.5 text-orange-600" />
            <span>CNC Cutting Sheet</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-btn text-xs font-medium shadow-sm transition-all">
            <Wallet className="w-3.5 h-3.5 text-amber-600" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 4. Orders & Production Table */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active Job Orders & Production Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredOrders.length} orders for {BUSINESS_UNITS[businessUnit].shortName}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-2.5 py-1 text-xs rounded-btn font-medium transition-colors ${
                selectedFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setSelectedFilter("pending")}
              className={`px-2.5 py-1 text-xs rounded-btn font-medium transition-colors ${
                selectedFilter === "pending" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Pending Approval
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                <th className="py-3 px-4">Job Order #</th>
                <th className="py-3 px-4">Business Unit</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Due Target</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-brand-navy">
                    {order.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${order.badgeClass}`}>
                      {order.unit === "graphics" ? "Graphics" : "CNC Services"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {order.customer}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">
                    {order.description}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.dueDate}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {order.amount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                      {order.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
