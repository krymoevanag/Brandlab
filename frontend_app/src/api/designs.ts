import { apiClient } from "./client";
import type { PaginatedResponse } from "./customers";

export type DesignStatus = "assigned" | "in_progress" | "review_pending" | "revision_requested" | "approved" | "rejected";

export interface DesignFile {
  id: number;
  assignment: number;
  version: number;
  file_url: string | null;
  filename: string;
  checksum: string;
  file_size: number;
  notes: string;
  uploaded_by: number | null;
  uploaded_by_email: string | null;
  created_at: string;
}

export interface DesignComment {
  id: number;
  assignment: number;
  author: number;
  author_email: string;
  comment: string;
  created_at: string;
}

export interface DesignAssignment {
  id: number;
  job: number;
  job_number: string;
  designer: number;
  designer_email: string;
  status: DesignStatus;
  due_at: string | null;
  notes: string;
  approved_by: number | null;
  approved_by_email: string | null;
  approved_at: string | null;
  files: DesignFile[];
  comments: DesignComment[];
  created_at: string;
  updated_at: string;
}

export interface DesignAssignmentInput {
  job: number;
  designer: number;
  due_at?: string | null;
  notes?: string;
}

export const designApi = {
  list: (query = "") => apiClient.request<PaginatedResponse<DesignAssignment>>(`/v1/design-assignments/${query ? `?${query}` : ""}`),
  create: (input: DesignAssignmentInput) => apiClient.request<DesignAssignment>("/v1/design-assignments/", { method: "POST", body: JSON.stringify(input) }),
  approve: (id: number) => apiClient.request<DesignAssignment>(`/v1/design-assignments/${id}/approve/`, { method: "POST" }),
  requestRevision: (id: number, reason: string) => apiClient.request<DesignAssignment>(`/v1/design-assignments/${id}/request-revision/`, { method: "POST", body: JSON.stringify({ reason }) }),
  addComment: (id: number, comment: string) => apiClient.request<DesignComment>(`/v1/design-assignments/${id}/comment/`, { method: "POST", body: JSON.stringify({ comment }) }),
  uploadFile: (id: number, file: File, notes = "") => {
    const form = new FormData();
    form.append("file", file);
    form.append("filename", file.name);
    form.append("notes", notes);
    return apiClient.request<DesignFile>(`/v1/design-assignments/${id}/upload-file/`, { method: "POST", body: form });
  },
};
