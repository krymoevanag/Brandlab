import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Filter, Plus, Search, XCircle } from "lucide-react";
import { ApiError } from "../../api/client";
import { customerApi, type Customer } from "../../api/customers";
import { quotationApi, type Quotation, type QuotationInput, type ServiceOption } from "../../api/quotations";

const EMPTY_FORM: QuotationInput = { branch: 0, customer: 0, status: "draft", discount: "0", tax: "0", valid_until: null, notes: "", items: [{ service: null, description: "", quantity: "1", unit_price: "0", discount: "0" }] };
const errorText = (error: unknown) => error instanceof ApiError ? error.message : "Unable to complete the quotation request.";
const asList = <T,>(value: { results?: T[] } | T[]) => Array.isArray(value) ? value : value.results || [];

interface Props { permissions?: string[]; }

export const QuotationsPage: React.FC<Props> = ({ permissions = [] }) => {
  const canCreate = permissions.includes("quotations.create");
  const canEdit = permissions.includes("quotations.edit");
  const canConvert = permissions.includes("jobs.create");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Quotation["status"] | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<QuotationInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [quoteResponse, customerResponse, serviceResponse] = await Promise.all([
        quotationApi.list({ search: search.trim(), status: status === "all" ? undefined : status }),
        customerApi.list({ is_active: true }), quotationApi.services(),
      ]);
      setQuotations(quoteResponse.results); setCustomers(customerResponse.results); setServices(asList(serviceResponse));
    } catch (requestError) { setError(errorText(requestError)); } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);

  const openCreate = () => {
    const firstCustomer = customers[0]; setEditing(null); setFormOpen(true); setFormError(null);
    setForm({ ...EMPTY_FORM, branch: firstCustomer?.branch || 0, customer: firstCustomer?.id || 0 });
  };
  const openEdit = (quotation: Quotation) => {
    setEditing(quotation); setFormOpen(true); setFormError(null);
    setForm({ branch: quotation.branch, customer: quotation.customer, status: quotation.status, discount: quotation.discount, tax: quotation.tax, valid_until: quotation.valid_until, notes: quotation.notes, items: quotation.items.map(({ id: _id, total: _total, ...item }) => item) });
  };
  const updateItem = (index: number, field: string, value: string | number | null) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.branch || !form.customer || form.items.some((item) => !item.description.trim() || Number(item.quantity) <= 0 || Number(item.unit_price) < 0)) { setFormError("Select a customer and provide a description, positive quantity and valid price for every item."); return; }
    setSaving(true); setFormError(null);
    try { if (editing) await quotationApi.update(editing.id, form); else await quotationApi.create(form); await load(); setEditing(null); setFormOpen(false); }
    catch (requestError) { setFormError(errorText(requestError)); } finally { setSaving(false); }
  };
  const convert = async (quotation: Quotation) => {
    setConvertingId(quotation.id); setError(null);
    try { await quotationApi.convertToJob(quotation.id); await load(); } catch (requestError) { setError(errorText(requestError)); } finally { setConvertingId(null); }
  };
  const counts = useMemo(() => ["draft", "sent", "accepted", "converted", "rejected"].map((value) => ({ value, count: quotations.filter((quotation) => quotation.status === value).length })), [quotations]);

  return <div className="space-y-5">
    {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><form onSubmit={save} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-card p-5 space-y-4"><div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">{editing ? "Edit quotation" : "New quotation"}</h2><button type="button" onClick={() => { setEditing(null); setFormOpen(false); setFormError(null); }}><XCircle className="w-5 h-5 text-slate-400" /></button></div>{formError && <div role="alert" className="p-3 rounded-btn bg-rose-50 border border-rose-200 text-xs text-rose-700">{formError}</div>}<QuotationFields form={form} setForm={setForm} customers={customers} services={services} updateItem={updateItem} /><FormActions saving={saving} onCancel={() => { setEditing(null); setFormOpen(false); setFormError(null); }} /></form></div>}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-action" />Orders & Quotations</h1><p className="text-xs text-slate-500 mt-0.5">{quotations.length} quotations in your permitted scope</p></div>{canCreate && <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-action text-white rounded-btn text-xs font-semibold"><Plus className="w-4 h-4" />New Quotation</button>}</div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{counts.map((entry) => <button key={entry.value} onClick={() => setStatus(status === entry.value ? "all" : entry.value as Quotation["status"])} className="bg-white rounded-card border border-slate-200 p-3 text-center"><p className="text-lg font-bold text-slate-900">{entry.count}</p><p className="text-[10px] uppercase text-slate-500">{entry.value}</p></button>)}</div>
    <div className="bg-white rounded-card border border-slate-200 p-4 flex gap-3"><div className="relative flex-1"><Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search quotations…" className="form-input pl-8" /></div><Filter className="w-4 h-4 text-slate-400 mt-2" /></div>
    {error && <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-card text-sm text-rose-700">{error}</div>}
    {loading ? <div className="py-12 text-center text-slate-400">Loading quotations…</div> : quotations.length === 0 ? <div className="py-12 text-center text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No quotations found.</p></div> : <div className="bg-white rounded-card border border-slate-200 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Number</th><th className="p-3">Customer</th><th className="p-3">Branch</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{quotations.map((quotation) => <tr key={quotation.id}><td className="p-3 font-mono font-semibold">{quotation.number}</td><td className="p-3 font-medium">{quotation.customer_details?.name}</td><td className="p-3">{quotation.branch_details?.code}</td><td className="p-3 font-semibold">KES {Number(quotation.total).toLocaleString()}</td><td className="p-3 capitalize">{quotation.status}</td><td className="p-3 flex gap-2">{canEdit && quotation.status !== "converted" && <button onClick={() => openEdit(quotation)} className="px-2 py-1 border rounded text-[11px]">Edit</button>}{canConvert && quotation.status !== "converted" && quotation.status !== "rejected" && <button disabled={convertingId === quotation.id} onClick={() => void convert(quotation)} className="px-2 py-1 bg-brand-action text-white rounded text-[11px] disabled:opacity-60">{convertingId === quotation.id ? "Converting…" : "Convert to job"}</button>}</td></tr>)}</tbody></table></div>}
  </div>;
};

const QuotationFields: React.FC<{ form: QuotationInput; setForm: React.Dispatch<React.SetStateAction<QuotationInput>>; customers: Customer[]; services: ServiceOption[]; updateItem: (index: number, field: string, value: string | number | null) => void }> = ({ form, setForm, customers, services, updateItem }) => <>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs font-semibold">Customer<select required value={form.customer} onChange={(event) => { const customer = customers.find((entry) => entry.id === Number(event.target.value)); setForm({ ...form, customer: Number(event.target.value), branch: customer?.branch || form.branch }); }} className="form-input mt-1">{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} ({customer.branch_details?.code})</option>)}</select></label><label className="text-xs font-semibold">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Quotation["status"] })} className="form-input mt-1"><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label></div>
  {form.items.map((item, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-2 p-3 bg-slate-50 rounded-btn"><input required placeholder="Description" value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} className="form-input" /><input required type="number" min="0.01" step="0.01" placeholder="Quantity" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} className="form-input" /><select value={item.service || ""} onChange={(event) => { const service = services.find((entry) => entry.id === Number(event.target.value)); updateItem(index, "service", service?.id || null); if (service && !item.description) updateItem(index, "description", service.name); if (service && item.unit_price === "0") updateItem(index, "unit_price", service.base_price); }} className="form-input"><option value="">No service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select><input required type="number" min="0" step="0.01" placeholder="Unit price" value={item.unit_price} onChange={(event) => updateItem(index, "unit_price", event.target.value)} className="form-input" /></div>)}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input type="number" min="0" step="0.01" placeholder="Discount" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} className="form-input" /><input type="number" min="0" step="0.01" placeholder="Tax" value={form.tax} onChange={(event) => setForm({ ...form, tax: event.target.value })} className="form-input" /></div><textarea placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="form-input min-h-20" />
</>;

const FormActions: React.FC<{ saving: boolean; onCancel: () => void }> = ({ saving, onCancel }) => <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="px-4 py-2 border rounded-btn text-xs">Cancel</button><button disabled={saving} className="px-4 py-2 bg-brand-action text-white rounded-btn text-xs font-semibold disabled:opacity-60">{saving ? "Saving…" : "Save quotation"}</button></div>;
