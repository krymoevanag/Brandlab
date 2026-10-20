import React from "react";
import { BrandLogo } from "../branding/BrandLogo";
import type { BusinessUnit } from "../../types/business";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Layers,
  Cpu,
  Printer,
  Package,
  Wallet,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "customers"
  | "quotations"
  | "invoices"
  | "jobs"
  | "cnc"
  | "printing"
  | "materials"
  | "expenses"
  | "payments"
  | "reports"
  | "audit"
  | "users";

interface AppSidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeUnit?: BusinessUnit;
  roles: string[];
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  activeUnit = "all",
  roles,
}) => {
  const can = (allowed: string[]) =>
    roles.includes("owner") || roles.includes("superadmin") || allowed.some((role) => roles.includes(role));
  // Active accent changes per business unit
  const accentBorder =
    activeUnit === "cnc" ? "border-l-cnc" : "border-l-graphics";
  const accentText =
    activeUnit === "cnc" ? "text-cnc" : "text-graphics";
  const accentBadgeBg =
    activeUnit === "cnc" ? "bg-cnc/20 text-cnc" : "bg-graphics/20 text-graphics";

  const businessNav: NavItem[] = [
    { id: "dashboard",  label: "Dashboard",            icon: LayoutDashboard },
    ...(can(["owner"]) ? [{ id: "users" as NavTab, label: "Staff & Access", icon: Users }] : []),
    ...(can(["branch_manager", "sales_attendant", "designer", "cnc_operator"]) ? [{ id: "customers" as NavTab, label: "Customers", icon: Users }] : []),
    ...(can(["branch_manager", "sales_attendant", "designer", "cnc_operator"]) ? [{ id: "quotations" as NavTab, label: "Orders & Quotations", icon: FileText }] : []),
    ...(can(["branch_manager", "finance_officer"]) ? [{ id: "invoices" as NavTab, label: "Invoices & Receipts", icon: Receipt }] : []),
  ];

  const productionNav: NavItem[] = [
    ...(can(["branch_manager", "sales_attendant", "designer", "cnc_operator"]) ? [{ id: "jobs" as NavTab, label: "Job Cards", icon: Layers, badge: "8" }] : []),
    ...(can(["cnc_operator"]) ? [{ id: "cnc" as NavTab, label: "CNC Production", icon: Cpu }] : []),
    ...(can(["branch_manager", "designer"]) ? [{ id: "printing" as NavTab, label: "Printing & Branding", icon: Printer }] : []),
    ...(can(["branch_manager", "storekeeper", "cnc_operator"]) ? [{ id: "materials" as NavTab, label: "Materials & Stock", icon: Package }] : []),
  ];

  const financeNav: NavItem[] = [
    ...(can(["branch_manager", "finance_officer", "storekeeper"]) ? [{ id: "expenses" as NavTab, label: "Expenses", icon: Wallet, badge: "3" }] : []),
    ...(can(["branch_manager", "finance_officer"]) ? [{ id: "payments" as NavTab, label: "Payments", icon: CreditCard }] : []),
    ...(can(["branch_manager", "finance_officer"]) ? [{ id: "reports" as NavTab, label: "Reports", icon: BarChart3 }] : []),
    ...(can(["owner"]) ? [{ id: "audit" as NavTab, label: "Audit Logs", icon: ShieldCheck }] : []),
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      {!collapsed && (
        <p className="px-3 mb-1.5 text-2xs font-semibold uppercase tracking-widest text-white/30">
          {title}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-standard",
                "border-l-[3px]",
                isActive
                  ? `bg-brand-charcoalMid ${accentBorder} ${accentText}`
                  : "border-l-transparent text-white/60 hover:text-white hover:bg-white/5",
                collapsed ? "justify-center" : "",
              ].join(" ")}
            >
              <Icon
                className={[
                  "w-4 h-4 flex-shrink-0",
                  isActive ? accentText : "text-white/50",
                ].join(" ")}
              />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${isActive ? accentBadgeBg : "bg-white/10 text-white/60"}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      className={[
        "bg-brand-charcoal h-screen flex flex-col justify-between z-30 flex-shrink-0",
        "transition-all duration-200 border-r border-white/5",
        collapsed ? "w-[60px]" : "w-64",
      ].join(" ")}
    >
      {/* ── Brand header ── */}
      <div>
        <div className={`p-3 border-b border-white/5 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <div className="space-y-2 w-full">
              {/* A to Z Graphics identity */}
              <div className="flex items-center gap-2.5 p-1.5 bg-white/5 rounded-btn border border-white/10">
                <BrandLogo variant="graphics" size="sm" showText={false} />
                <div className="leading-tight min-w-0">
                  <p className="text-xs font-semibold text-white truncate">A to Z Graphics</p>
                  <p className="text-2xs text-graphics font-medium">Branding & Gifts</p>
                </div>
              </div>
              {/* A to Z CNC identity */}
              <div className="flex items-center gap-2.5 p-1.5 bg-white/5 rounded-btn border border-white/10">
                <BrandLogo variant="cnc" size="sm" showText={false} />
                <div className="leading-tight min-w-0">
                  <p className="text-xs font-semibold text-white truncate">A to Z CNC Services</p>
                  <p className="text-2xs text-cnc font-medium">Precision Cutting</p>
                </div>
              </div>
            </div>
          ) : (
            <BrandLogo variant="compact" size="sm" />
          )}

          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-btn text-white/30 hover:text-white hover:bg-white/10 transition-colors ml-2 flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="p-3 overflow-y-auto max-h-[calc(100vh-160px)]">
          {renderNavGroup("Business", businessNav)}
          {renderNavGroup("Production", productionNav)}
          {renderNavGroup("Finance", financeNav)}
        </nav>
      </div>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-white/5">
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-full p-1 rounded-btn text-white/30 hover:text-white hover:bg-white/10 transition-colors flex justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-2xs text-white/25 text-center leading-relaxed">
            <p className="font-semibold text-white/40">A to Z Mgmt v2.0</p>
            <p>Nairobi · Meru</p>
          </div>
        )}
      </div>
    </aside>
  );
};
