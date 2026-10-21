import { apiClient } from "./client";
import type { BranchSummary, PaginatedResponse } from "./customers";

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid";
export interface Expense { id: number; expense_number: string; branch: number; branch_details: BranchSummary; department: string; category: string; amount: string; supplier: string; description: string; date_incurred: string; date_paid: string | null; payment_method: string | null; status: ExpenseStatus; submitted_by_email: string; approved_by_email: string | null; notes: string; }
export interface ExpenseInput { branch: number; department: string; category: string; amount: string; supplier: string; description: string; date_incurred: string; payment_method?: string; notes?: string; }
export const expenseApi = {
  list: (search = "") => apiClient.request<PaginatedResponse<Expense>>(`/v1/expenses/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  create: (input: ExpenseInput) => apiClient.request<Expense>("/v1/expenses/", { method: "POST", body: JSON.stringify(input) }),
  approve: (id: number) => apiClient.request<Expense>(`/v1/expenses/${id}/approve/`, { method: "POST" }),
  pay: (id: number, data: { date_paid?: string; payment_method?: string; notes?: string }) => apiClient.request<Expense>(`/v1/expenses/${id}/pay/`, { method: "POST", body: JSON.stringify(data) }),
};
