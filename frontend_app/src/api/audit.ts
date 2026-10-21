import { apiClient } from "./client";
import type { PaginatedResponse } from "./customers";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "VOID" | "CANCEL" | "REVERSE" | "EXPORT" | "LOGIN" | "PAYMENT" | "CONVERT";

export interface AuditLog {
  id: number;
  user: number | null;
  user_email: string | null;
  branch: number | null;
  branch_name: string | null;
  branch_code: string | null;
  action: AuditAction;
  entity: string;
  entity_id: string;
  reason: string;
  ip_address: string | null;
  created_at: string;
}

export const auditApi = {
  list: (params: { search?: string; action?: AuditAction; page?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.action) query.set("action", params.action);
    if (params.page) query.set("page", String(params.page));
    const suffix = query.toString();
    return apiClient.request<PaginatedResponse<AuditLog>>(`/v1/audit-logs/${suffix ? `?${suffix}` : ""}`);
  },
};
