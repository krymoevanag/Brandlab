import React from "react";
import type { BusinessUnit } from "../../types/business";
import { BusinessUnitSwitcher } from "../branding/BusinessUnitSwitcher";
import { Search, Bell, MapPin, LogOut, Lock } from "lucide-react";

interface AppHeaderProps {
  activeUnit: BusinessUnit;
  onUnitChange: (unit: BusinessUnit) => void;
  currentBranch: string;
  onBranchChange: (branch: string) => void;
  canSwitchBranch: boolean;
  userEmail: string;
  userRole: string;
  allowedUnits: BusinessUnit[];
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeUnit,
  onUnitChange,
  currentBranch,
  onBranchChange,
  canSwitchBranch,
  userEmail,
  userRole,
  allowedUnits,
  onLogout,
}) => {
  const initials = userEmail.slice(0, 2).toUpperCase();
  const displayName = userEmail.split("@")[0].replace(/[._]/g, " ");

  return (
    <header className="h-14 bg-white border-b border-brand-border px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-card">

      {/* Left: business unit switcher */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block border-r border-brand-border pr-4">
          <p className="text-2xs font-semibold text-brand-muted uppercase tracking-widest">
            A to Z Management
          </p>
        </div>
        <BusinessUnitSwitcher
          activeUnit={activeUnit}
          onChange={onUnitChange}
          allowedUnits={allowedUnits}
          variant="pill"
        />
      </div>

      {/* Centre: global search */}
      <div className="flex-1 max-w-sm hidden lg:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search orders, customers, jobs..."
            aria-label="Global search"
            className="form-input pl-8 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Right: branch, notifications, user */}
      <div className="flex items-center gap-2">

        {/* Branch selector */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-surface border rounded-btn text-xs ${
            canSwitchBranch ? "border-brand-border" : "border-slate-300"
          }`}
          title={canSwitchBranch ? "Change active branch" : "Branch changes are restricted to owners and administrators"}
        >
          <MapPin className="w-3.5 h-3.5 text-brand-charcoal" />
          {canSwitchBranch ? (
            <select
              value={currentBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              aria-label="Select branch"
              className="bg-transparent font-semibold text-brand-charcoal focus:outline-none cursor-pointer text-xs"
            >
              <option value="NBI">Nairobi (NBI)</option>
              <option value="MER">Meru (MER)</option>
            </select>
          ) : (
            <span aria-label="Current branch" className="font-semibold text-brand-charcoal">
              {currentBranch === "MER" ? "Meru (MER)" : "Nairobi (NBI)"}
            </span>
          )}
          {!canSwitchBranch && <Lock aria-hidden="true" className="w-3 h-3 text-brand-muted" />}
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative p-1.5 text-brand-muted hover:text-brand-charcoal hover:bg-brand-surface rounded-btn transition-colors duration-standard"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1 right-1 border border-white" />
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-brand-border">
          <div className="w-7 h-7 rounded-full bg-brand-charcoal text-white flex items-center justify-center font-display font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-semibold text-brand-charcoal truncate max-w-[120px] capitalize">
              {displayName}
            </p>
            <p className="text-2xs text-brand-muted capitalize">
              {userRole.replace(/_/g, " ")}
            </p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="p-1.5 text-brand-muted hover:text-rose-600 hover:bg-rose-50 rounded-btn transition-colors duration-standard ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
