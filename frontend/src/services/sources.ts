// File: services/sources.ts
import type { Source } from "@/types/source";
import type {
  SourceCreatePayload,
  SourceUpdatePayload,
} from "@/types/source";

const API = process.env.NEXT_PUBLIC_API_URL; 
// e.g. "https://api.example.com/" (make sure it ends with a slash if you concatenate with "monitoring-sources")
const BASE = `${API}monitoring-sources`;

//
// 1) createSource → POST /monitoring-sources/
//
export async function createSource(
  payload: SourceCreatePayload
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

//
// 2) updateSource → PATCH /monitoring-sources/{source_id}
//
export async function updateSource(
  sourceId: string,
  payload: SourceUpdatePayload
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

//
// 3) getSource → GET /monitoring-sources/{source_id}
//
export async function getSource(sourceId: string): Promise<Source> {
  const res = await fetch(`${BASE}/${sourceId}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch Source failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Source;
}

//
// 4) listSources → GET /monitoring-sources/?skip=<int>&limit=<int>
//
export async function listSources(
  skip = 0,
  limit = 100
): Promise<Source[]> {
  const res = await fetch(`${BASE}/?skip=${skip}&limit=${limit}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List Sources failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Source[];
}

//
// 5) deleteSource → DELETE /monitoring-sources/{source_id}
//
export async function deleteSource(sourceId: string): Promise<void> {
  const res = await fetch(`${BASE}/${sourceId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete Source failed (${res.status}): ${text}`);
  }
}
