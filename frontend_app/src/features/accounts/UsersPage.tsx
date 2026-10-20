import React, { useEffect, useState } from "react";
import { UserPlus, ShieldCheck } from "lucide-react";

interface UsersPageProps { accessToken: string; }
interface Option { id: number; code: string; name: string; }
interface StaffUser { id: number; email: string; first_name: string; last_name: string; is_active: boolean; roles: Option[]; branches: Option[]; business_units: string[]; }

const API = "http://127.0.0.1:8000/api/v1";

async function list<T>(path: string, token: string): Promise<T[]> {
  const response = await fetch(`${API}/${path}/`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Unable to load account data.");
  const data = await response.json();
  return data.results || data;
}

export const UsersPage: React.FC<UsersPageProps> = ({ accessToken }) => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", role: "", branch: "", unit: "" });

  const load = async () => {
    try {
      const [userData, roleData, branchData, unitData] = await Promise.all([
        list<StaffUser>("users", accessToken),
        list<Option>("roles", accessToken),
        list<Option>("branches", accessToken),
        list<Option>("business-units", accessToken),
      ]);
      setUsers(userData); setRoles(roleData); setBranches(branchData); setUnits(unitData);
      setForm((current) => ({ ...current, role: current.role || String(roleData[0]?.id || ""), branch: current.branch || String(branchData[0]?.id || ""), unit: current.unit || String(unitData[0]?.id || "") }));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load users."); }
  };

  useEffect(() => { void load(); }, [accessToken]);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    const response = await fetch(`${API}/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name,
        role_ids: form.role ? [Number(form.role)] : [], branch_ids: form.branch ? [Number(form.branch)] : [],
        business_unit_ids: form.unit ? [Number(form.unit)] : [], is_active: true,
      }),
    });
    if (!response.ok) { const data = await response.json(); setError(data.detail || "User could not be created."); return; }
    setForm({ email: "", password: "", first_name: "", last_name: "", role: form.role, branch: form.branch, unit: form.unit });
    await load();
  };

  return <div className="space-y-6">
    <div><h2 className="text-lg font-bold text-slate-900">Staff & Access</h2><p className="text-xs text-slate-500 mt-1">Create accounts and assign roles, branches and business units.</p></div>
    {error && <div className="p-3 rounded-btn bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-5">
      <form onSubmit={createUser} className="bg-white rounded-card border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2"><UserPlus className="w-4 h-4 text-brand-action" /><h3 className="font-bold text-sm">Create staff account</h3></div>
        {([['first_name','First name'],['last_name','Last name'],['email','Email'],['password','Temporary password']] as const).map(([key, label]) => <input key={key} required className="form-input" type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} placeholder={label} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
        <select className="form-input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
        <select className="form-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
        <button className="w-full py-2.5 rounded-btn bg-brand-charcoal text-white text-xs font-semibold hover:bg-brand-charcoalMid">Create account</button>
      </form>
      <div className="bg-white rounded-card border border-slate-200 overflow-hidden"><div className="p-5 border-b border-slate-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /><h3 className="font-bold text-sm">Current access assignments</h3></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">User</th><th className="text-left p-3">Role</th><th className="text-left p-3">Branch</th><th className="text-left p-3">Business</th><th className="text-left p-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}><td className="p-3 font-medium">{user.email}</td><td className="p-3">{user.roles.map((role) => role.name).join(', ') || '—'}</td><td className="p-3">{user.branches.map((branch) => branch.code).join(', ') || '—'}</td><td className="p-3">{user.business_units?.join(', ') || '—'}</td><td className="p-3"><span className={user.is_active ? 'text-emerald-600' : 'text-rose-600'}>{user.is_active ? 'Active' : 'Inactive'}</span></td></tr>)}</tbody></table></div></div>
    </div>
  </div>;
};
