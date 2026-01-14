// File: src/services/sources.ts
import type { Source, SourcePayload } from "@/types/source";
import { apiFetchJson } from "@/services/api";

export async function listSources(
  authToken?: string | null,
  projectId?: string,
  locationId?: string,
  skip = 0
): Promise<Source[]> {
  if (locationId) {
    return apiFetchJson<Source[]>(
      `/locations/${locationId}/sources?skip=${skip}`,
      { method: "GET" },
      authToken
    );
  }

  if (projectId) {
    return apiFetchJson<Source[]>(
      `/projects/${projectId}/sources?skip=${skip}`,
      { method: "GET" },
      authToken
    );
  }

  return apiFetchJson<Source[]>(
    `/monitoring-sources/?skip=${skip}`,
    { method: "GET" },
    authToken
  );
}

export async function createSource(
  payload: SourcePayload,
  authToken?: string | null
): Promise<Source> {
  return apiFetchJson<Source>(
    `/monitoring-sources/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function updateSource(
  sourceId: string,
  payload: SourcePayload,
  authToken?: string | null
): Promise<Source> {
  return apiFetchJson<Source>(
    `/monitoring-sources/${sourceId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function getSource(
  sourceId: string,
  authToken?: string | null
): Promise<Source> {
  return apiFetchJson<Source>(
    `/monitoring-sources/${sourceId}`,
    { method: "GET" },
    authToken
  );
}

export async function getSourceByName(
  name: string,
  authToken?: string | null
): Promise<Source> {
  return apiFetchJson<Source>(
    `/monitoring-sources/name/${encodeURIComponent(name)}`,
    { method: "GET" },
    authToken
  );
}

export async function deleteSource(
  sourceId: string,
  authToken?: string | null
): Promise<void> {
  await apiFetchJson<void>(
    `/monitoring-sources/${sourceId}`,
    { method: "DELETE" },
    authToken
  );
}

export async function listDistinctRootDirectories(
  authToken?: string | null
): Promise<string[]> {
  const sources = await listSources(authToken);
  return Array.from(
    new Set(
      sources
        .map((s) => s.root_directory?.trim())
        .filter((x): x is string => !!x)
    )
  ).sort();
}
