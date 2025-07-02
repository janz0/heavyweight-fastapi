// File: services/sources.ts
import type { Source, SourcePayload } from "@/types/source";

const API = process.env.NEXT_PUBLIC_API_URL; 
const BASE = `${API}monitoring-sources`;
const PROJECTS_BASE = `${API}projects`

export async function listSources(
  projectId?: string,   // optional
  skip = 0,
  limit = 100
): Promise<Source[]> {
  const url = projectId
    ? `${PROJECTS_BASE}/${projectId}/sources?skip=${skip}&limit=${limit}`
    : `${BASE}/?skip=${skip}&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`List sources failed (${res.status})`);
  return res.json() as Promise<Source[]>;
}

export async function createSource(
  payload: SourcePayload
): Promise<Source> {
  const res = await fetch(`${BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create Source failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Source;
}

export async function updateSource(
  sourceId: string,
  payload: SourcePayload
): Promise<Source> {
  const res = await fetch(`${BASE}/${sourceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update Source failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Source;
}

export async function getSource(sourceId: string): Promise<Source> {
  const res = await fetch(`${BASE}/${sourceId}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch Source failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Source;
}

export async function deleteSource(sourceId: string): Promise<void> {
  const res = await fetch(`${BASE}/${sourceId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete Source failed (${res.status}): ${text}`);
  }
}
