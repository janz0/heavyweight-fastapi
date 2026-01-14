// File: src/services/sensors.ts
import type { MonitoringSensor, MonitoringSensorPayload } from "@/types/sensor";
import { apiFetchJson } from "@/services/api";

/**
 * Fetch a list of monitoring sensors
 */
export async function listSensors(
  authToken?: string | null,
  projectId?: string,
  locId?: string,
  srcId?: string,
  skip = 0
): Promise<MonitoringSensor[]> {
  // Prefer the most specific scope first
  if (locId) {
    return apiFetchJson<MonitoringSensor[]>(
      `/locations/${locId}/sensors?skip=${skip}`,
      { method: "GET" },
      authToken
    );
  }

  if (projectId) {
    return apiFetchJson<MonitoringSensor[]>(
      `/projects/${projectId}/sensors?skip=${skip}`,
      { method: "GET" },
      authToken
    );
  }

  if (srcId) {
    return apiFetchJson<MonitoringSensor[]>(
      `/monitoring-sources/${srcId}/sensors?skip=${skip}`,
      { method: "GET" },
      authToken
    );
  }

  // fallback: list *all* sensors (should be org-filtered server-side)
  return apiFetchJson<MonitoringSensor[]>(
    `/monitoring-sensors/?skip=${skip}`,
    { method: "GET" },
    authToken
  );
}

export async function getSensorByName(
  name: string,
  authToken?: string | null
): Promise<MonitoringSensor> {
  return apiFetchJson<MonitoringSensor>(
    `/monitoring-sensors/name/${encodeURIComponent(name)}`,
    { method: "GET" },
    authToken
  );
}

export async function createSensor(
  payload: MonitoringSensorPayload,
  authToken?: string | null
): Promise<MonitoringSensor> {
  return apiFetchJson<MonitoringSensor>(
    `/monitoring-sensors/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function updateSensor(
  id: string,
  payload: MonitoringSensorPayload,
  authToken?: string | null
): Promise<MonitoringSensor> {
  return apiFetchJson<MonitoringSensor>(
    `/monitoring-sensors/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    authToken
  );
}

export async function deleteSensor(
  id: string,
  authToken?: string | null
): Promise<void> {
  await apiFetchJson<void>(
    `/monitoring-sensors/${id}`,
    { method: "DELETE" },
    authToken
  );
}
