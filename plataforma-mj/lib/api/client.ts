import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_COOKIE = "sb-access-token";

export const getToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const clearToken = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
};

export const setToken = (token: string) => {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

/** Clears session and redirects to login (used on 401) */
const clearSessionAndRedirect = () => {
  clearToken();
  useAuthStore.getState().clearUser();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

export type ApiError = { error: string };

export type ApiResult<T> = { data?: T; error?: string; status: number };

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getToken();
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (res.status === 401) {
    if (!path.includes("/api/auth/login") && !path.includes("/api/auth/forgot-password")) {
      clearSessionAndRedirect();
    }
    return { error: (body as ApiError).error ?? "Unauthorized", status: 401 };
  }

  if (!res.ok) {
    return { error: (body as ApiError).error ?? res.statusText, status: res.status };
  }
  return { data: body as T, status: res.status };
}

export const api = {
  get:    <T>(path: string)                      => request<T>(path, { method: "GET" }),
  post:   <T>(path: string, body: unknown)       => request<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)       => request<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)       => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: <T>(path: string)                      => request<T>(path, { method: "DELETE" }),
};
