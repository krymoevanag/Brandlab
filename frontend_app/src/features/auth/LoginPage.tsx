import React, { useState } from "react";
import graphicsLogo from "../../assets/logos/az-graphics.jpg";
import cncLogo from "../../assets/logos/az-cnc-services.jpg";
import { Lock, Mail, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { ApiError, apiClient, type AuthSession } from "../../api/client";

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession, user: { email: string; roles: string[]; branch: string; branchId: number; permissions: string[]; isSuperuser: boolean }) => void;
}

function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "We could not complete sign in. Please try again.";
  const detail = error.message.toLowerCase();
  if (error.status === 0) return "Unable to reach the server. Check your connection and try again.";
  if (error.status === 408) return "Sign in timed out. Check your connection and try again.";
  if (error.status === 401 && detail.includes("inactive")) return "This account is inactive. Contact an administrator.";
  if (error.status === 401) return "Invalid email or password.";
  if (error.status === 403) return "Your account is not authorized to sign in.";
  if (error.status === 400) return `Please check your sign-in details. ${error.message}`;
  if (error.status >= 500) return "The server could not complete sign in. Please try again shortly.";
  return error.message || "We could not complete sign in. Please try again.";
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("NBI");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.request<{
        access: string;
        refresh: string;
        user: { email: string; roles?: string[]; permissions?: string[]; is_superuser?: boolean; default_branch?: { id?: number; code?: string } | null };
      }>("/v1/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, branch }),
      });

      const roles = Array.isArray(data.user?.roles) ? data.user.roles : [];
      onLoginSuccess({ access: data.access, refresh: data.refresh }, {
        email: data.user.email,
        roles,
        branch: data.user.default_branch?.code || branch,
        branchId: data.user.default_branch?.id || 0,
        permissions: Array.isArray(data.user.permissions) ? data.user.permissions : [],
        isSuperuser: Boolean(data.user.is_superuser),
      });
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* ── Ambient glows ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-graphics/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cnc/8 blur-3xl pointer-events-none" />

      {/* ── Login card ── */}
      <div className="w-full max-w-[400px] bg-white rounded-dialog shadow-dialog overflow-hidden relative z-10 animate-fade-in">

        {/* ── Dual-brand header ── */}
        <div className="pt-7 pb-5 px-7 text-center bg-brand-surface border-b border-brand-border">
          <div className="flex items-center justify-center gap-4 mb-4">

            {/* Graphics logo */}
            <div className="text-center">
              <img
                src={graphicsLogo}
                alt="A to Z Graphics Branding & Gifts Shop"
                className="w-14 h-14 object-contain rounded-full shadow-card border-2 border-graphics/30 bg-white p-0.5 mx-auto"
              />
              <p className="text-2xs font-bold text-graphics mt-1 uppercase tracking-wider">Graphics</p>
            </div>

            {/* Divider */}
            <div className="flex flex-col items-center gap-1">
              <div className="h-6 w-px bg-brand-border" />
              <span className="text-2xs font-semibold text-brand-muted">+</span>
              <div className="h-6 w-px bg-brand-border" />
            </div>

            {/* CNC logo */}
            <div className="text-center">
              <img
                src={cncLogo}
                alt="A to Z CNC Services"
                className="w-14 h-14 object-contain rounded-btn shadow-card border-2 border-cnc/30 bg-white p-0.5 mx-auto"
              />
              <p className="text-2xs font-bold text-cnc mt-1 uppercase tracking-wider">CNC Services</p>
            </div>
          </div>

          <h1 className="font-display text-base font-semibold text-brand-charcoal tracking-tight">
            A to Z Business Management
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Business & Production Management System
          </p>
        </div>

        {/* ── Login form ── */}
        <div className="px-7 py-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-btn text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-brand-charcoal mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@atozgraphics.co.ke"
                  className="form-input pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-brand-charcoal mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input pl-9"
                />
              </div>
            </div>

            {/* Branch */}
            <div>
              <label htmlFor="login-branch" className="block text-xs font-semibold text-brand-charcoal mb-1.5">
                Operating Branch
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  id="login-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="form-input pl-9 cursor-pointer"
                >
                  <option value="NBI">Nairobi Head Office (NBI)</option>
                  <option value="MER">Meru Regional Branch (MER)</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2.5 px-4 bg-brand-charcoal hover:bg-brand-charcoalMid text-white rounded-btn text-sm font-semibold shadow-card transition-all duration-standard flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authenticating…
                </span>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* ── Security footer ── */}
        <div className="py-2.5 px-7 bg-brand-surface border-t border-brand-border flex items-center justify-center gap-1.5 text-2xs text-brand-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted session · Role-based access control</span>
        </div>
      </div>

      {/* Version */}
      <p className="mt-4 text-2xs text-white/20 font-mono">v2.0 · Nairobi & Meru</p>
    </div>
  );
};
