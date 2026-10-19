import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  type: "individual" | "corporate";
  branch: string;
  jobs: number;
  totalSpend: string;
  lastOrder: string;
  isActive: boolean;
}

const DEMO_CUSTOMERS: Customer[] = [
  { id: 1, name: "Safaricom PLC", phone: "+254 20 427 3000", email: "procurement@safaricom.co.ke", type: "corporate", branch: "NBI", jobs: 14, totalSpend: "KES 1,245,000", lastOrder: "19 Oct 2026", isActive: true },
  { id: 2, name: "Apex Architects Nairobi", phone: "+254 722 331 004", email: "info@apexarchitects.co.ke", type: "corporate", branch: "NBI", jobs: 7, totalSpend: "KES 582,000", lastOrder: "18 Oct 2026", isActive: true },
  { id: 3, name: "Meru Greens Ltd", phone: "+254 734 220 119", email: "orders@merugreens.co.ke", type: "corporate", branch: "MER", jobs: 5, totalSpend: "KES 248,000", lastOrder: "15 Oct 2026", isActive: true },
  { id: 4, name: "KenGen Corporate Office", phone: "+254 20 366 6000", email: "admin@kengen.co.ke", type: "corporate", branch: "NBI", jobs: 9, totalSpend: "KES 934,500", lastOrder: "14 Oct 2026", isActive: true },
  { id: 5, name: "Java House Kenya", phone: "+254 790 512 200", email: "brands@javahouse.co.ke", type: "corporate", branch: "NBI", jobs: 12, totalSpend: "KES 432,000", lastOrder: "13 Oct 2026", isActive: true },
  { id: 6, name: "James Mwangi", phone: "+254 711 445 022", email: "jmwangi@gmail.com", type: "individual", branch: "NBI", jobs: 2, totalSpend: "KES 34,000", lastOrder: "11 Oct 2026", isActive: true },
  { id: 7, name: "Baraka Events Ltd", phone: "+254 720 883 441", email: "bookings@barakaevents.ke", type: "corporate", branch: "MER", jobs: 4, totalSpend: "KES 189,000", lastOrder: "9 Oct 2026", isActive: true },
  { id: 8, name: "Grace Wanjiku", phone: "+254 798 321 005", email: "gracew@yahoo.com", type: "individual", branch: "MER", jobs: 1, totalSpend: "KES 12,500", lastOrder: "5 Oct 2026", isActive: false },
];

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    type: "corporate" as "individual" | "corporate",
    branch: "NBI",
    address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-card shadow-2xl border border-slate-200 animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Add New Customer</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register a new customer in the system</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-btn text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Customer Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["corporate", "individual"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex items-center gap-2 p-2.5 rounded-btn border text-xs font-medium transition-all ${
                    form.type === t
                      ? "border-brand-action bg-blue-50 text-brand-action"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t === "corporate" ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span className="capitalize">{t}</span>
                  {form.type === t && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {form.type === "corporate" ? "Company Name" : "Full Name"} *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={form.type === "corporate" ? "e.g. Safaricom PLC" : "e.g. James Mwangi"}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-btn text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+254 7xx xxx xxx"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-btn text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@company.co.ke"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-btn text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
              />
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registering Branch</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={form.branch}
                onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-btn text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action cursor-pointer"
              >
                <option value="NBI">Nairobi Head Office (NBI)</option>
                <option value="MER">Meru Regional Branch (MER)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 border border-slate-200 text-slate-600 rounded-btn text-xs font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 px-4 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CustomersPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "corporate" | "individual">("all");
  const [branchFilter, setBranchFilter] = useState<"all" | "NBI" | "MER">("all");
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(DEMO_CUSTOMERS);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || c.type === typeFilter;
    const matchBranch = branchFilter === "all" || c.branch === branchFilter;
    return matchSearch && matchType && matchBranch;
  });

  const handleAddCustomer = (data: Partial<Customer>) => {
    const newCustomer: Customer = {
      id: customers.length + 1,
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      type: data.type || "corporate",
      branch: data.branch || "NBI",
      jobs: 0,
      totalSpend: "KES 0",
      lastOrder: "—",
      isActive: true,
    };
    setCustomers([newCustomer, ...customers]);
  };

  return (
    <div className="space-y-5">
      {showModal && <AddCustomerModal onClose={() => setShowModal(false)} onSave={handleAddCustomer} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-action" />
            Customer Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {customers.filter((c) => c.isActive).length} active customers · {customers.length} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-action hover:bg-blue-700 text-white rounded-btn text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-card border border-slate-200/90 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-btn text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Type filter */}
          <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs">
            {(["all", "corporate", "individual"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 font-medium capitalize transition-colors ${
                  typeFilter === t ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Branch filter */}
          <div className="flex rounded-btn border border-slate-200 overflow-hidden text-xs">
            {(["all", "NBI", "MER"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBranchFilter(b)}
                className={`px-2.5 py-1.5 font-medium transition-colors ${
                  branchFilter === b ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-card border border-slate-200/90 shadow-card hover:shadow-cardHover transition-all group cursor-pointer"
          >
            <div className="p-4">
              {/* Type badge + branch */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    customer.type === "corporate"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {customer.type === "corporate" ? <Building2 className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                  {customer.type === "corporate" ? "Corporate" : "Individual"}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {customer.branch}
                </span>
              </div>

              {/* Name */}
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-action transition-colors leading-tight mb-1">
                {customer.name}
              </h3>

              {/* Contact info */}
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 mt-3 pt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Jobs</p>
                  <p className="text-sm font-bold text-slate-800">{customer.jobs}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Spend</p>
                  <p className="text-xs font-bold text-emerald-700">{customer.totalSpend}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 rounded-b-card flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Last order: {customer.lastOrder}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-action transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No customers found</p>
          <p className="text-xs">Try a different search or filter</p>
        </div>
      )}
    </div>
  );
};
