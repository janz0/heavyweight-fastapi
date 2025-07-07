// File: src/services/sensors.ts
import type { MonitoringSensor, MonitoringSensorPayload } from '@/types/sensor';

const API = process.env.NEXT_PUBLIC_API_URL;
const BASE = `${API}monitoring-sensors`;
const PROJECTS_BASE = `${API}projects`;
const LOCATIONS_BASE = `${API}locations`;

/**
 * Fetch a list of monitoring sensors
 */
export async function listSensors(
  projectId?: string,
  locId?: string,
  skip = 0,
  limit = 200
): Promise<MonitoringSensor[]> {
  let url: string;
  if (locId) {
    url = `${LOCATIONS_BASE}/${locId}/sensors?skip=${skip}&limit=${limit}`;
  } else if (projectId) {
    url = `${PROJECTS_BASE}/${projectId}/sensors?skip=${skip}&limit=${limit}`;
  } else {
    url = `${BASE}/?skip=${skip}&limit=${limit}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List sensors failed (${res.status})`);
  return res.json();
}

export async function getSensorByName(
  name: string
): Promise<MonitoringSensor> {
  const res = await fetch(`${BASE}/name/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`Fetch sensor failed (${res.status})`);
  return (await res.json()) as MonitoringSensor;
}

export async function createSensor(
  payload: MonitoringSensorPayload
): Promise<MonitoringSensor> {
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create sensor failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as MonitoringSensor;
}

export async function updateSensor(
  id: string,
  payload: MonitoringSensorPayload
): Promise<MonitoringSensor> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update sensor failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as MonitoringSensor;
}

export async function deleteSensor(
  id: string
): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Delete sensor failed (${res.status}): ${txt}`);
  }
}