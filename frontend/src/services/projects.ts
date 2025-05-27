// File: src/services/projects.ts
// Client-side wrapper for project API calls
import type { Project } from '@/types/project'
import type { ProjectPayload } from '@/types/project'

const API = process.env.NEXT_PUBLIC_API_URL
const BASE = `${API}/projects`

export async function createProject(
  payload: ProjectPayload
): Promise<Project> {
  const res = await fetch(`${BASE}/projects/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Project;
}

export async function updateProject(
  id: string,
  payload: ProjectPayload
): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method:  'PATCH',  // match your @router.patch
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Project;
}

export async function getProject(id: string): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fetch project failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as Project;
}

export async function listProjects(
  skip = 0,
  limit = 100
): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects/?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error(`List failed (${res.status})`);
  return (await res.json()) as Project[];
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Delete failed (${res.status}): ${text}`)
  }
}