// app/services/teams.ts
import type { Team, TeamCreatePayload } from "@/types/teams";

const API = process.env.NEXT_PUBLIC_API_URL;
const BASE = `${API}teams`;


export async function listTeams(authToken?: string | null): Promise<Team[]> {
  const res = await fetch(`${BASE}/`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to load teams");
  }

  return res.json();
}

export async function createTeam(payload: TeamCreatePayload, authToken?: string | null): Promise<Team> {
  const res = await fetch(`${BASE}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify(payload),
    credentials: "include", // optional, if you use cookies
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create team");
  }

  return res.json();
}
