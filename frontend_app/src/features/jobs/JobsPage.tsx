import React, { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Cpu,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";

type JobStatus =
  | "pending_deposit"
  | "design_pending"
  | "design_approved"
  | "in_production"
  | "quality_check"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled";

type Priority = "low" | "normal" | "high" | "urgent";

interface Job {
  id: string;
  number: string;
  customer: string;
  unit: "graphics" | "cnc";
  branch: string;
  description: string;
  amount: string;
  status: JobStatus;
  priority: Priority;
  dueDate: string;
  assignedTo: string;
  depositPaid: boolean;
  progress: number;
}

const STATUS_STEPS: { key: JobStatus; label: string; short: string }[] = [
  { key: "pending_deposit", label: "Pending Deposit", short: "Deposit" },
  { key: "design_pending", label: "Design Pending", short: "Design" },
  { key: "design_approved", label: "Design Approved", short: "Approved" },
  { key: "in_production", label: "In Production", short: "Production" },
  { key: "quality_check", label: "Quality Check", short: "QC" },
  { key: "ready_for_delivery", label: "Ready", short: "Ready" },
  { key: "delivered", label: "Delivered", short: "Done" },
];

const PRIORITY_CONFIG: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-rose-50 text-rose-700",
};

const DEMO_JOBS: Job[] = [
  { id: "1", number: "AZNr-JOB-2026-0042", customer: "Safaricom PLC", unit: "graphics", branch: "NBI", description: "Fleet Branding & Reflective Vinyl Wraps", amount: "KES 145,000", status: "in_production", priority: "urgent", dueDate: "Tomorrow", assignedTo: "John M.", depositPaid: true, progress: 55 },
  { id: "2", number: "AZNr-JOB-2026-0043", customer: "Apex Architects Nairobi", unit: "cnc", branch: "NBI", description: "Brass Architectural Lettering & 3D Router Cutting", amount: "KES 88,500", status: "quality_check", priority: "high", dueDate: "21 Oct 2026", assignedTo: "Sarah K.", depositPaid: true, progress: 80 },
  { id: "3", number: "AZMr-JOB-2026-0019", customer: "Meru Greens Ltd", unit: "graphics", branch: "MER", description: "Rollup Banners & UV Flatbed Signage", amount: "KES 34,000", status: "ready_for_delivery", priority: "normal", dueDate: "22 Oct 2026", assignedTo: "Tom W.", depositPaid: true, progress: 100 },
  { id: "4", number: "AZNr-JOB-2026-0044", customer: "KenGen Corporate Office", unit: "cnc", branch: "NBI", description: "Acrylic Machine Guard Shields & Laser Engraving", amount: "KES 62,000", status: "design_approved", priority: "normal", dueDate: "24 Oct 2026", assignedTo: "Sarah K.", depositPaid: true, progress: 30 },
  { id: "5", number: "AZNr-JOB-2026-0045", customer: "Java House Kenya", unit: "graphics", branch: "NBI", description: "Custom Engraved Wooden Coasters & Gift Boxes", amount: "KES 28,000", status: "pending_deposit", priority: "low", dueDate: "25 Oct 2026", assignedTo: "Unassigned", depositPaid: false, progress: 0 },
  { id: "6", number: "AZNr-JOB-2026-0046", customer: "Equity Bank", unit: "graphics", branch: "NBI", description: "Branch interior murals & directional signs", amount: "KES 178,000", status: "design_pending", priority: "high", dueDate: "26 Oct 2026", assignedTo: "Alice N.", depositPaid: true, progress: 10 },
];

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [expanded, setExpanded] = useState(false);
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === job.status);
  const isDelivered = job.status === "delivered";

  return (
    <div className="bg-white rounded-card border border-slate-200/90 shadow-card hover:shadow-cardHover transition-all">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-[11px] font-bold text-brand-navy bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {job.number}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                job.unit === "graphics"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-orange-50 text-orange-700 border-orange-200"
              }`}>
                {job.unit === "graphics" ? <Printer className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                {job.unit === "graphics" ? "Graphics" : "CNC"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${PRIORITY_CONFIG[job.priority]}`}>
                {job.priority === "urgent" && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />}
                {job.priority}
              </span>
              {!job.depositPaid && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ⚠ No Deposit
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 truncate">{job.customer}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{job.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-slate-900">{job.amount}</p>
            <div className="flex items-center gap-1 mt-1 justify-end text-[11px] text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{job.dueDate}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 justify-end text-[11px] text-slate-500">
              <User className="w-3 h-3" />
              <span>{job.assignedTo}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500">Progress</span>
            <span className="text-[10px] font-bold text-slate-700">{job.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${
                job.status === "ready_for_delivery" || isDelivered
                  ? "bg-emerald-500"
                  : job.status === "quality_check"
                  ? "bg-amber-500"
                  : "bg-brand-action"
              }`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expand: Status Pipeline */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold">
          Current: {STATUS_STEPS[stepIndex]?.label || job.status}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = step.key === job.status;
              const isDone = idx < stepIndex;
              return (
                <React.Fragment key={step.key}>
                  <div className={`flex flex-col items-center min-w-[60px] text-center`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isActive
                        ? "bg-brand-action border-brand-action text-white"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{idx + 1}</span>}
                    </div>
                    <span className={`text-[9px] mt-0.5 font-medium ${isActive ? "text-brand-action" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                      {step.short}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 min-w-[8px] ${isDone ? "bg-emerald-300" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-[11px] font-semibold shadow-sm transition-all">
              <ArrowRight className="w-3 h-3" />
              Advance Status
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-btn text-[11px] font-medium transition-all">
              View Job Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const JobsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<"all" | "graphics" | "cnc">("all");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "active" | "all">("active");

  const ACTIVE_STATUSES: JobStatus[] = ["pending_deposit", "design_pending", "design_approved", "in_production", "quality_check", "ready_for_delivery"];

  const filtered = DEMO_JOBS.filter((j) => {
    const qs = search.toLowerCase();
    const matchSearch = !qs || j.customer.toLowerCase().includes(qs) || j.number.toLowerCase().includes(qs);
    const matchUnit = unitFilter === "all" || j.unit === unitFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? ACTIVE_STATUSES.includes(j.status) : j.status === statusFilter);
    return matchSearch && matchUnit && matchStatus;
  });

  const urgentCount = DEMO_JOBS.filter((j) => j.priority === "urgent" || j.priority === "high").length;
  const pendingDepositCount = DEMO_JOBS.filter((j) => !j.depositPaid).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-action" />
            Job Cards & Production
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {DEMO_JOBS.length} total jobs ·
            <span className="text-amber-700 font-semibold ml-1">{urgentCount} high/urgent</span> ·
            <span className="text-rose-700 font-semibold ml-1">{pendingDepositCount} awaiting deposit</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-btn text-xs font-medium hover:bg-slate-50 transition-all">
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            Graphics Job
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-btn text-xs font-medium hover:bg-slate-50 transition-all">
            <Cpu className="w-3.5 h-3.5 text-orange-600" />
            CNC Sheet
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-xs font-semibold shadow-sm transition-all">
            <Plus className="w-4 h-4" />
            New Job Card
          </button>
        </div>
      </div>

      {/* Quick Status Filters */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { key: "active", label: "Active Jobs", count: DEMO_JOBS.filter((j) => ACTIVE_STATUSES.includes(j.status)).length, color: "text-brand-action" },
          { key: "pending_deposit", label: "Pending Deposit", count: DEMO_JOBS.filter((j) => j.status === "pending_deposit").length, color: "text-amber-700" },
          { key: "in_production", label: "In Production", count: DEMO_JOBS.filter((j) => j.status === "in_production").length, color: "text-sky-700" },
          { key: "quality_check", label: "Quality Check", count: DEMO_JOBS.filter((j) => j.status === "quality_check").length, color: "text-purple-700" },
          { key: "ready_for_delivery", label: "Ready", count: DEMO_JOBS.filter((j) => j.status === "ready_for_delivery").length, color: "text-emerald-700" },
          { key: "all", label: "All Jobs", count: DEMO_JOBS.length, color: "text-slate-600" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key as any)}
            className={`bg-white rounded-card border p-2.5 text-center shadow-card hover:shadow-cardHover transition-all ${
              statusFilter === f.key ? "border-brand-action ring-2 ring-brand-action/20" : "border-slate-200/90"
            }`}
          >
            <p className={`text-base font-bold ${f.color}`}>{f.count}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-tight">{f.label}</p>
          </button>
        ))}
      </div>

      {/* Search & Unit Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job number or customer..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-btn text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action shadow-card"
          />
        </div>
        <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs bg-white shadow-card">
          {(["all", "graphics", "cnc"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnitFilter(u)}
              className={`flex items-center gap-1 px-3 py-1.5 font-medium capitalize transition-colors ${
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

      {/* Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No jobs match your criteria</p>
        </div>
      )}
    </div>
  );
};
