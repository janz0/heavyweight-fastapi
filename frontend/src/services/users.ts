// src/services/users.ts
import { apiFetchJson } from "@/services/api";

export type MeResponse = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export function getMe(authToken?: string | null) {
  return apiFetchJson<MeResponse>("/users/me", { method: "GET" }, authToken);
}
