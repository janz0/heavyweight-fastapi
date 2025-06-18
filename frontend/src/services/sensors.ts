// File: src/services/sensors.ts
import type { MonitoringSensor, MonitoringSensorCreate, MonitoringSensorUpdate } from '@/types/sensor';

const API = process.env.NEXT_PUBLIC_API_URL;
const BASE = `${API}monitoring-sensors`;

/**
 * Fetch a list of monitoring sensors
 */
export async function listSensors(
  skip = 0,
  limit = 100
): Promise<MonitoringSensor[]> {
  const res = await fetch(`${BASE}/?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error(`List sensors failed (${res.status})`);
  return (await res.json()) as MonitoringSensor[];
}

export async function getSensor(
  id: string
): Promise<MonitoringSensor> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(`Fetch sensor failed (${res.status})`);
  return (await res.json()) as MonitoringSensor;
}

export async function createSensor(
  payload: MonitoringSensorCreate
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
  payload: MonitoringSensorUpdate
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