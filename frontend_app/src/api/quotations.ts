import { apiClient } from "./client";
import type { BranchSummary, Customer, PaginatedResponse } from "./customers";

export interface ServiceOption {
  id: number;
  code: string;
  name: string;
  description: string;
  unit: string;
  base_price: string;
  is_active: boolean;
}

export interface QuotationItem {
  id?: number;
  service: number | null;
  description: string;
  quantity: string;
  unit_price: string;
  discount: string;
  total?: string;
}

export interface Quotation {
  id: number;
  number: string;
  branch: number;
  branch_details: BranchSummary;
  customer: number;
  customer_details: Customer;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  valid_until: string | null;
  notes: string;
  created_by: number | null;
  created_by_email?: string;
  items: QuotationItem[];
  created_at: string;
  updated_at: string;
}

export interface QuotationInput {
  branch: number;
  customer: number;
  status?: Quotation["status"];
  discount?: string;
  tax?: string;
  valid_until?: string | null;
  notes?: string;
  items: Omit<QuotationItem, "id" | "total">[];
}

export interface QuotationQuery {
  search?: string;
  status?: Quotation["status"];
  branch?: number;
  page?: number;
}

const queryString = (query: QuotationQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
};

export const quotationApi = {
  list: (query: QuotationQuery = {}) => apiClient.request<PaginatedResponse<Quotation>>(`/v1/quotations/${queryString(query)}`),
  retrieve: (id: number) => apiClient.request<Quotation>(`/v1/quotations/${id}/`),
  create: (input: QuotationInput) => apiClient.request<Quotation>("/v1/quotations/", { method: "POST", body: JSON.stringify(input) }),
  update: (id: number, input: Partial<QuotationInput>) => apiClient.request<Quotation>(`/v1/quotations/${id}/`, { method: "PATCH", body: JSON.stringify(input) }),
  convertToJob: (id: number) => apiClient.request(`/v1/quotations/${id}/convert-to-job/`, { method: "POST" }),
  services: () => apiClient.request<PaginatedResponse<ServiceOption> | ServiceOption[]>("/v1/services/?is_active=true"),
};
