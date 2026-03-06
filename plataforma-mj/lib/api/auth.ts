import { api, clearToken, setToken } from "./client";
import type { AuthUser } from "@/lib/types";

export type LoginPayload = { email: string; password: string };

// Backend login returns { user: {...+role}, accessToken, refreshToken }
// wrapped by the ok() util as { success: true, data: {...} }
interface BackendLoginData {
  user: {
    id: string;
    email: string;
    name: string;
    role: AuthUser["role"];
    tenantId: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export const loginWithBackend = async (payload: LoginPayload): Promise<AuthUser> => {
  const { data, error } = await api.post<{ data: BackendLoginData }>("/api/auth/login", payload);
  if (error || !data) throw new Error(error ?? "Failed to login");

  const { user, accessToken } = data.data;
  setToken(accessToken);

  return {
    profileId: user.id,
    supabaseUid: "",
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  };
};

export const logoutFromBackend = async (): Promise<void> => {
  await api.post("/api/auth/logout", {}).catch(() => {});
  clearToken();
};

interface BackendMeData {
  id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
  tenantId: string | null;
  isActive: boolean;
}

export const getMe = async (): Promise<AuthUser> => {
  const { data, error } = await api.get<{ data: BackendMeData }>("/api/auth/me");
  if (error || !data) throw new Error(error ?? "Failed to fetch profile");

  const profile = data.data;
  return {
    profileId: profile.id,
    supabaseUid: "",
    email: profile.email,
    name: profile.name,
    role: profile.role,
    tenantId: profile.tenantId,
  };
};

export const forgotPassword = async (email: string): Promise<void> => {
  const { error } = await api.post("/api/auth/forgot-password", { email });
  if (error) throw new Error(error);
};
