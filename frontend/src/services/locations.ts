// File: src/services/locations.ts
import type { Location, LocationPayload } from "@/types/location";
import { apiFetchJson } from "@/services/api";

export async function getLocation(
  locationId: string,
  authToken?: string | null
): Promise<Location> {
  return apiFetchJson<Location>(
    `/locations/${locationId}`,
    { method: "GET" },
    authToken
  );
}

export async function getLocationByName(
  name: string,
  authToken?: string | null
): Promise<Location> {
  return apiFetchJson<Location>(
    `/locations/name/${name}`,
    { method: "GET" },
    authToken
  );
}

export async function listLocations(
  authToken?: string | null,
  projectId?: string
): Promise<Location[]> {
  if (projectId) {
    return apiFetchJson<Location[]>(
      `/projects/${projectId}/locations?skip=0&limit=100`,
      { method: "GET" },
      authToken
    );
  }

  return apiFetchJson<Location[]>(
    `/locations/?skip=0&limit=100`,
    { method: "GET" },
    authToken
  );
}

export async function createLocation(
  payload: LocationPayload,
  authToken?: string | null
): Promise<Location> {
  return apiFetchJson<Location>(
    `/locations/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function updateLocation(
  id: string,
  payload: LocationPayload,
  authToken?: string | null
): Promise<Location> {
  return apiFetchJson<Location>(
    `/locations/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function deleteLocation(
  id: string,
  authToken?: string | null
): Promise<void> {
  await apiFetchJson<void>(
    `/locations/${id}`,
    { method: "DELETE" },
    authToken
  );
}
