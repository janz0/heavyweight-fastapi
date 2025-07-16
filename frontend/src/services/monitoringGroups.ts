// File: src/services/monitoringGroups.ts
import type { MonitoringGroup, MonitoringGroupPayload } from "@/types/monitoringGroup";

const API_ROOT       = process.env.NEXT_PUBLIC_API_URL!;
//const LOCATIONS_BASE = `${API_ROOT}locations`;
const GROUPS_BASE    = `${API_ROOT}monitoring-groups`;

// List all groups for a given location
export async function listMonitoringGroups(
  locationId: string,
  skip = 0,
  limit = 100
): Promise<MonitoringGroup[]> {
  const url = `${GROUPS_BASE}/by-location/${locationId}?skip=${skip}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List groups failed (${res.status})`);
  return res.json() as Promise<MonitoringGroup[]>;
}

// Create a new group under a location
export async function createMonitoringGroup(
  payload: MonitoringGroupPayload
): Promise<MonitoringGroup> {
  const res = await fetch(`${GROUPS_BASE}/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create group failed (${res.status}): ${txt}`);
  }
  return res.json() as Promise<MonitoringGroup>;
}

// (future) update a group
export async function updateMonitoringGroup(
  id: string,
  payload: Partial<MonitoringGroupPayload>
): Promise<MonitoringGroup> {
  const res = await fetch(`${GROUPS_BASE}/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update group failed (${res.status}): ${txt}`);
  }
  return res.json() as Promise<MonitoringGroup>;
}

// (future) delete a group
export async function deleteMonitoringGroup(id: string): Promise<void> {
  const res = await fetch(`${GROUPS_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Delete group failed (${res.status}): ${txt}`);
  }
}
