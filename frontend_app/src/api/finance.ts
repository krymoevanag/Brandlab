import { apiClient } from "./client";
import type { BranchSummary, Customer, PaginatedResponse } from "./customers";

export interface Invoice {
  id: number; number: string; branch: number; branch_details: BranchSummary; customer: number; customer_details: Customer; job: number | null; status: string; subtotal: string; discount: string; tax: string; total: string; paid_amount: string; balance_due: string; due_at: string | null; notes: string; created_by_email?: string; allocations: PaymentAllocation[]; created_at: string; updated_at: string;
}
export interface PaymentAllocation { id: number; invoice: number; invoice_number: string; amount: string; }
export interface Payment { id: number; branch: number; branch_details: BranchSummary; customer: number; customer_details: Customer; method: "mpesa" | "cash" | "bank_transfer"; amount: string; reference: string; idempotency_key: string; status: string; received_at: string; allocations: PaymentAllocation[]; receipt?: Receipt; }
export interface Receipt { id: number; number: string; branch: number; branch_name: string; customer: number; customer_name: string; payment: number; payment_amount: string; payment_method: string; payment_reference: string; invoice: number | null; created_at: string; }
export interface InvoiceInput { branch: number; customer: number; job?: number | null; status?: string; subtotal: string; discount?: string; tax?: string; due_at?: string | null; notes?: string; }
export interface PaymentInput { branch: number; customer: number; method: Payment["method"]; amount: string; reference: string; idempotency_key: string; allocations: Array<{ invoice: number; amount: string }>; notes?: string; }

export const financeApi = {
  invoices: (search = "") => apiClient.request<PaginatedResponse<Invoice>>(`/v1/invoices/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createInvoice: (input: InvoiceInput) => apiClient.request<Invoice>("/v1/invoices/", { method: "POST", body: JSON.stringify(input) }),
  payments: () => apiClient.request<PaginatedResponse<Payment>>("/v1/payments/"),
  recordPayment: (input: PaymentInput) => apiClient.request<Payment>("/v1/payments/", { method: "POST", body: JSON.stringify(input) }),
  reversePayment: (id: number, reason: string) => apiClient.request<Payment>(`/v1/payments/${id}/reverse/`, { method: "POST", body: JSON.stringify({ reason }) }),
  receipts: () => apiClient.request<PaginatedResponse<Receipt>>("/v1/receipts/"),
};
