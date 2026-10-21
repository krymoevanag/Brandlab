import React, { useCallback, useEffect, useState } from "react";
import { Building2, Check, Mail, MapPin, Phone, Plus, Search, User, Users, X } from "lucide-react";
import { ApiError } from "../../api/client";
import { customerApi, type Customer, type CustomerInput } from "../../api/customers";

interface CustomerForm { name: string; phone: string; email: string; customer_type: CustomerInput["customer_type"]; address: string; }
const EMPTY_FORM: CustomerForm = { name: "", phone: "", email: "", customer_type: "corporate", address: "" };
const errorText = (error: unknown) => error instanceof ApiError ? error.message : "Something went wrong. Please try again.";

const CustomerModal: React.FC<{ customer: Customer | null; onClose: () => void; onSaved: () => Promise<void> }> = ({ customer, onClose, onSaved }) => {
  const [form, setForm] = useState<CustomerForm>(customer ? { name: customer.name, phone: customer.phone, email: customer.email, customer_type: customer.customer_type, address: customer.address } : EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setError("Name and phone number are required."); return; }
    setError(null); setSaving(true);
    try {
      const input: CustomerInput = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), customer_type: form.customer_type, address: form.address.trim() };
      if (customer) await customerApi.update(customer.id, input); else await customerApi.create(input);
      await onSaved(); onClose();
    } catch (requestError) { setError(errorText(requestError)); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"><div className="w-full max-w-md bg-white rounded-card shadow-2xl border border-slate-200">
    <div className="p-5 border-b border-slate-100 flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">{customer ? "Edit Customer" : "Add New Customer"}</h2><p className="text-xs text-slate-500 mt-0.5">Your branch access is enforced by the backend.</p></div><button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-btn text-slate-400"><X className="w-4 h-4" /></button></div>
    <form onSubmit={submit} className="p-5 space-y-4">{error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-btn text-xs text-rose-700">{error}</div>}
      <label className="block text-xs font-semibold text-slate-700">Customer Type<select value={form.customer_type} onChange={(event) => setForm({ ...form, customer_type: event.target.value as CustomerInput["customer_type"] })} className="form-input mt-1.5"><option value="corporate">Corporate / Business</option><option value="individual">Individual</option></select></label>
      <label className="block text-xs font-semibold text-slate-700">Name *<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="form-input mt-1" autoFocus /></label>
      <label className="block text-xs font-semibold text-slate-700">Phone Number *<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="form-input mt-1" /></label>
      <label className="block text-xs font-semibold text-slate-700">Email Address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="form-input mt-1" /></label>
      <label className="block text-xs font-semibold text-slate-700">Address<textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="form-input min-h-16 mt-1" /></label>
      <div className="flex gap-2 pt-2"><button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-btn text-xs">Cancel</button><button type="submit" disabled={saving} className="flex-1 py-2 bg-brand-action text-white rounded-btn text-xs font-semibold disabled:opacity-60">{saving ? "Saving…" : <><Check className="w-3.5 h-3.5 inline mr-1" />{customer ? "Save Changes" : "Save Customer"}</>}</button></div>
    </form>
  </div></div>;
};

export const CustomersApiPage: React.FC<{ permissions?: string[] }> = ({ permissions = [] }) => {
  const canCreate = permissions.includes("customers.create");
  const canEdit = permissions.includes("customers.edit");
  const [customers, setCustomers] = useState<Customer[]>([]); const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CustomerInput["customer_type"]>("all"); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [modalCustomer, setModalCustomer] = useState<Customer | null | undefined>(undefined);
  const loadCustomers = useCallback(async () => { setLoading(true); setError(null); try { const response = await customerApi.list({ search: search.trim(), customer_type: typeFilter === "all" ? undefined : typeFilter, is_active: true }); setCustomers(response.results); } catch (requestError) { setError(errorText(requestError)); } finally { setLoading(false); } }, [search, typeFilter]);
  useEffect(() => { const timer = window.setTimeout(() => void loadCustomers(), 250); return () => window.clearTimeout(timer); }, [loadCustomers]);
  return <div className="space-y-5">
    {modalCustomer !== undefined && <CustomerModal customer={modalCustomer} onClose={() => setModalCustomer(undefined)} onSaved={loadCustomers} />}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-brand-action" />Customer Management</h1><p className="text-xs text-slate-500 mt-0.5">{customers.length} customers in your permitted scope</p></div>{canCreate && <button onClick={() => setModalCustomer(null)} aria-label="Register a new customer" className="flex items-center justify-center gap-2 px-5 py-3 min-h-11 bg-blue-700 hover:bg-blue-800 text-white rounded-btn text-sm font-bold shadow-md ring-2 ring-blue-200"><Plus className="w-4 h-4" />Register Customer</button>}</div>
    <div className="bg-white rounded-card border border-slate-200/90 p-4 flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, or email…" className="form-input pl-8" /></div><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="form-input sm:w-44"><option value="all">All customer types</option><option value="corporate">Corporate</option><option value="individual">Individual</option></select></div>
    {error && <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-card text-sm text-rose-700">{error}</div>}
    {loading ? <div className="text-center py-12 text-slate-400">Loading customers…</div> : customers.length === 0 ? <div className="text-center py-12 text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No customers found</p><p className="text-xs">{canCreate ? "Register a customer or try a different search." : "No customers are available in your permitted scope."}</p></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{customers.map((customer) => <button key={customer.id} type="button" onClick={() => canEdit && setModalCustomer(customer)} className="text-left bg-white rounded-card border border-slate-200/90 shadow-card hover:shadow-cardHover transition-all group"><div className="p-4"><div className="flex items-center justify-between mb-3"><span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border " + (customer.customer_type === "corporate" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>{customer.customer_type === "corporate" ? <Building2 className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}{customer.customer_type === "corporate" ? "Corporate" : "Individual"}</span><span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{customer.branch_details?.code || "Unassigned"}</span></div><h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-action leading-tight mb-2">{customer.name}</h3><div className="space-y-1"><div className="flex items-center gap-1.5 text-[11px] text-slate-500"><Phone className="w-3 h-3" />{customer.phone}</div>{customer.email && <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate"><Mail className="w-3 h-3" /><span className="truncate">{customer.email}</span></div>}{customer.branch_details && <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><MapPin className="w-3 h-3" />{customer.branch_details.name}</div>}</div></div></button>)}</div>}
  </div>;
};
