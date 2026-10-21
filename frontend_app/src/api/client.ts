export interface ApiErrorPayload {
  detail?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(message: string, status: number, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface AuthSession {
  access: string;
  refresh: string;
}

interface AuthConfig {
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

function formatErrorValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatErrorValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => `${key}: ${formatErrorValue(nested)}`)
      .filter(Boolean)
      .join("; ");
  }
  return "";
}

function errorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload) return fallback;
  const detail = formatErrorValue(payload.detail);
  if (detail) return detail;

  const messages = Object.entries(payload)
    .map(([field, value]) => {
      const formatted = formatErrorValue(value);
      return formatted ? `${field}: ${formatted}` : "";
    })
    .filter(Boolean);
  return messages.length ? messages.join("; ") : fallback;
}

class ApiClient {
  private auth: AuthConfig = { session: null, onSessionChange: () => undefined };
  private refreshPromise: Promise<AuthSession | null> | null = null;

  configureAuth(auth: AuthConfig): void {
    this.auth = auth;
  }

  async request<T>(path: string, init: RequestInit = {}, canRefresh = true): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = new Headers(init.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (this.auth.session?.access) {
      headers.set("Authorization", `Bearer ${this.auth.session.access}`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
      if (response.status === 401 && canRefresh && this.auth.session?.refresh) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) return this.request<T>(path, init, false);
      }

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? (await response.json() as ApiErrorPayload)
        : null;
      if (!response.ok) {
        throw new ApiError(errorMessage(payload, `Request failed (${response.status}).`), response.status, payload);
      }
      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("The request timed out. Check the connection and try again.", 408);
      }
      throw new ApiError("Unable to reach the server. Check the backend connection and try again.", 0);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private async refreshAccessToken(): Promise<AuthSession | null> {
    if (this.refreshPromise) return this.refreshPromise;
    const refresh = this.auth.session?.refresh;
    if (!refresh) return null;

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/v1/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!response.ok) throw new Error("Refresh failed");
        const data = await response.json() as { access?: string; refresh?: string };
        if (!data.access) throw new Error("Refresh response did not include an access token");
        const session = { access: data.access, refresh: data.refresh || refresh };
        this.auth.onSessionChange(session);
        return session;
      } catch {
        this.auth.onSessionChange(null);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }
}

export const apiClient = new ApiClient();
