import { apiClient } from "./client";
import type { BranchSummary, Customer, PaginatedResponse } from "./customers";
import type { ServiceOption } from "./quotations";

export type JobStatus = "pending_deposit" | "design_pending" | "design_approved" | "in_production" | "quality_check" | "ready_for_delivery" | "delivered" | "cancelled";
export type JobPriority = "low" | "normal" | "high" | "urgent";
export interface JobItem { id?: number; service: number | null; description: string; quantity: string; unit_price: string; discount: string; line_total?: string; }
export interface Job { id: number; number: string; branch: number; branch_details: BranchSummary; customer: number; customer_details: Customer; quotation: number | null; status: JobStatus; priority: JobPriority; subtotal: string; discount: string; tax: string; total: string; due_at: string | null; notes: string; items: JobItem[]; }
export interface JobInput { branch: number; customer: number; quotation?: number | null; status?: JobStatus; priority?: JobPriority; discount?: string; tax?: string; due_at?: string | null; notes?: string; items: Omit<JobItem, "id" | "line_total">[]; }
export const jobApi = {
  list: (query = "") => apiClient.request<PaginatedResponse<Job>>(`/v1/jobs/${query ? `?search=${encodeURIComponent(query)}` : ""}`),
  create: (input: JobInput) => apiClient.request<Job>("/v1/jobs/", { method: "POST", body: JSON.stringify(input) }),
  updateStatus: (id: number, status: JobStatus, reason = "") => apiClient.request<Job>(`/v1/jobs/${id}/status/`, { method: "POST", body: JSON.stringify({ status, reason }) }),
  services: () => apiClient.request<PaginatedResponse<ServiceOption> | ServiceOption[]>("/v1/services/?is_active=true"),
};
