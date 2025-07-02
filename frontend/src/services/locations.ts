// File: src/services/locations.ts
import type { Location, LocationPayload } from "@/types/location";

const API_ROOT = process.env.NEXT_PUBLIC_API_URL!;
const BASE     = `${API_ROOT}locations`;
const PROJECTS_BASE = `${API_ROOT}projects`

export async function getLocation(
  locationId: string
): Promise<Location> {
  const res = await fetch(
    `${BASE}/${locationId}`
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fetch location failed (${res.status}): ${body}`);
  }
  return (await res.json()) as Location;
}

export async function listLocations(
  projectId?: string  // optional projectId
): Promise<Location[]> {
  let url: string;

  if (projectId) {
    url = `${PROJECTS_BASE}/${projectId}/locations?skip=0&limit=100`;
  } else {
    url = `${BASE}/?skip=0&limit=100`;  // Adjust this endpoint as needed
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`List failed (${res.status})`);
  }

  return res.json() as Promise<Location[]>;
}


export async function createLocation(
  payload: LocationPayload
): Promise<Location> {
  const res = await fetch(
    `${BASE}/`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as Location;
}

// ← new function:
export async function updateLocation(
  id: string,
  payload: LocationPayload
): Promise<Location> {
  const res = await fetch(
    `${BASE}/${id}`,
    {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as Location;
}

export async function deleteLocation(id: string): Promise<void> {
  const res = await fetch(
    `${BASE}/${id}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Delete failed (${res.status}): ${txt}`);
  }
}
