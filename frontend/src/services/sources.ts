// File: services/sources.ts
import type { Source, SourcePayload } from "@/types/source";

const API = process.env.NEXT_PUBLIC_API_URL; 
const BASE = `${API}monitoring-sources`;
const PROJECTS_BASE = `${API}projects`
const LOCATIONS_BASE = `${API}locations`;

export async function listSources(
  projectId?: string,
  locationId?: string,
  skip = 0,
): Promise<Source[]> {
  let url: string;

  if (projectId && locationId) {
    // get sources for a specific project *and* location
    url = `${PROJECTS_BASE}/${projectId}/locations/${locationId}/sources?skip=${skip}`;
  } else if (projectId) {
    // get all sources for a project
    url = `${PROJECTS_BASE}/${projectId}/sources?skip=${skip}`;
  } else if (locationId) {
    // get all sources for a location (across projects)
    url = `${LOCATIONS_BASE}/${locationId}/sources?skip=${skip}`;
  } else {
    // fallback: list *all* sources
    url = `${BASE}/?skip=${skip}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`List sources failed (${res.status})`);
  return (await res.json()) as Source[];
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

export async function getSourceByName(
  name: string
): Promise<Source> {
  const res = await fetch(`${BASE}/name/${name}`);
  if (!res.ok) throw new Error(`Fetch sensor failed (${res.status})`);
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
