import React, { useState } from "react";
import type { BusinessUnit } from "../../types/business";
import type { NavTab } from "./AppSidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { CustomersApiPage } from "../../features/customers/CustomersApiPage";
import { QuotationsPage } from "../../features/quotations/QuotationsPage";
import { InvoicesPage } from "../../features/finance/InvoicesPage";
import { JobsPage } from "../../features/jobs/JobsPage";
import { ExpensesPage } from "../../features/expenses/ExpensesPage";
import { ReportsPage } from "../../features/reports/ReportsPage";
import { AuditPage } from "../../features/audit/AuditPage";
import { DesignsPage } from "../../features/designs/DesignsPage";
import { UsersPage } from "../../features/accounts/UsersPage";
import type { AuthUser } from "../../App";
import { can } from "../../auth/permissions";

interface MainLayoutProps {
  user: AuthUser;
  token: string;
  onLogout: () => void;
}

/** Simple placeholder for modules that are still in progress */
const ComingSoonPage: React.FC<{ tab: NavTab; branch: string; unit: string }> = ({ tab, branch, unit }) => (
  <div className="p-10 bg-white rounded-card border border-slate-200 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">🔧</span>
    </div>
    <h3 className="text-base font-bold text-slate-800 capitalize mb-1">
      {tab.replace(/_/g, " ")} Module
    </h3>
    <p className="text-xs text-slate-500 mb-4">
      This module connects to <span className="font-mono bg-slate-100 px-1 rounded">GET /api/v1/{tab}/</span>
    </p>
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-brand-action text-xs font-semibold rounded-full border border-blue-200">
      <span>Branch: {branch}</span>
      <span>•</span>
      <span>Unit: {unit.toUpperCase()}</span>
    </div>
  </div>
);

export const MainLayout: React.FC<MainLayoutProps> = ({ user, token, onLogout }) => {
  const canUseCnc = can(user, "dashboard.cnc.view");
  const canSwitchBranch = user.isSuperuser || user.roles.includes("owner") || user.roles.includes("superadmin");
  const allowedUnits: BusinessUnit[] = canUseCnc ? ["all", "graphics", "cnc"] : ["all", "graphics"];
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [activeUnit, setActiveUnit] = useState<BusinessUnit>("all");
  const [currentBranch, setCurrentBranch] = useState<string>(user.branch || "NBI");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    const requiredPermission: Partial<Record<NavTab, string>> = {
      customers: "customers.view",
      quotations: "quotations.view",
      invoices: "finance.view",
      jobs: "jobs.view",
      cnc: "dashboard.cnc.view",
      printing: "designs.view",
      materials: "inventory.view",
      expenses: "expenses.create",
      payments: "payments.verify",
      reports: "reports.view",
      audit: "audit.view",
      users: "users.manage",
    };
    const permission = requiredPermission[currentTab];
    if (permission && !can(user, permission)) {
      return <div className="p-10 bg-white rounded-card border border-slate-200 text-center"><h3 className="text-base font-bold text-slate-800">Access restricted</h3><p className="text-xs text-slate-500 mt-1">Your current permissions do not allow this section.</p></div>;
    }
    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardPage
            businessUnit={activeUnit}
            onBusinessUnitChange={setActiveUnit}
            branchCode={currentBranch}
            userRole={user.roles[0] || "staff"}
            accessToken={token}
            permissions={user.permissions}
          />
        );
      case "customers":
        return <CustomersApiPage permissions={user.permissions} />;
      case "quotations":
        return <QuotationsPage permissions={user.permissions} />;
      case "invoices":
        return <InvoicesPage permissions={user.permissions} />;
      case "jobs":
        return <JobsPage permissions={user.permissions} />;
      case "expenses":
        return <ExpensesPage permissions={user.permissions} branchId={user.branchId} />;
      case "reports":
        return <ReportsPage />;
      case "audit":
        return <AuditPage />;
      case "printing":
        return <DesignsPage permissions={user.permissions} />;
      case "users":
        return <UsersPage accessToken={token} />;
      default:
        return <ComingSoonPage tab={currentTab} branch={currentBranch} unit={activeUnit} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-surface overflow-hidden">
      {/* 1. Collapsible Sidebar with dual identities */}
      <AppSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
      />

      {/* 2. Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <AppHeader
          activeUnit={activeUnit}
          onUnitChange={setActiveUnit}
          currentBranch={currentBranch}
          onBranchChange={setCurrentBranch}
          canSwitchBranch={canSwitchBranch}
          userEmail={user.email}
          userRole={user.roles[0] || "staff"}
          allowedUnits={allowedUnits}
          onLogout={onLogout}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};
