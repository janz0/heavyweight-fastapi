// File: src/services/projects.ts
// Client-side wrapper for project API calls

import type { Project } from "@/types/project";
import type { ProjectPayload } from "@/types/project";
import { apiFetchJson } from "@/services/api";

export async function createProject(
  payload: ProjectPayload,
  authToken?: string | null
): Promise<Project> {
  return apiFetchJson<Project>(
    "/projects/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function updateProject(
  id: string,
  payload: ProjectPayload,
  authToken?: string | null
): Promise<Project> {
  return apiFetchJson<Project>(
    `/projects/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function getProject(
  id: string,
  authToken?: string | null
): Promise<Project> {
  return apiFetchJson<Project>(`/projects/${id}`, { method: "GET" }, authToken);
}

export async function getProjectByNumber(
  number: string,
  authToken?: string | null
): Promise<Project> {
  return apiFetchJson<Project>(
    `/projects/by-number/${number}`,
    { method: "GET" },
    authToken
  );
}

export async function listProjects(
  authToken?: string | null,
  skip = 0
): Promise<Project[]> {
  return apiFetchJson<Project[]>(
    `/projects/?skip=${skip}`,
    { method: "GET" },
    authToken
  );
}

export async function deleteProject(
  id: string,
  authToken?: string | null
): Promise<void> {
  // apiFetchJson safely handles 204 and returns undefined
  await apiFetchJson<void>(
    `/projects/${id}`,
    { method: "DELETE" },
    authToken
  );
}
