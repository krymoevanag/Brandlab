import { apiClient } from "./client";

export interface BranchSummary {
  id: number;
  code: string;
  name: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  customer_type: "individual" | "corporate";
  address: string;
  branch: number | null;
  branch_details: BranchSummary | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  customer_type: "individual" | "corporate";
  address?: string;
  branch?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CustomerQuery {
  search?: string;
  customer_type?: CustomerInput["customer_type"];
  branch?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

function queryString(query: CustomerQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export const customerApi = {
  list: (query: CustomerQuery = {}) =>
    apiClient.request<PaginatedResponse<Customer>>(`/v1/customers/${queryString(query)}`),
  retrieve: (id: number) => apiClient.request<Customer>(`/v1/customers/${id}/`),
  create: (input: CustomerInput) =>
    apiClient.request<Customer>("/v1/customers/", { method: "POST", body: JSON.stringify(input) }),
  update: (id: number, input: Partial<CustomerInput>) =>
    apiClient.request<Customer>(`/v1/customers/${id}/`, { method: "PATCH", body: JSON.stringify(input) }),
};
