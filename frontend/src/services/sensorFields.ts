// File: src/services/sensorFields.ts

import type {
  MonitoringSensorField,
  MonitoringSensorFieldCreate,
  MonitoringSensorFieldUpdate
} from "@/types/sensorField";

const API = process.env.NEXT_PUBLIC_API_URL;
const SENSORS_BASE = `${API}monitoring-sensors`;
const FIELDS_BASE  = `${API}monitoring-sensor-fields`;

/**
 * Fetch all fields for a given sensor
 */
export async function listSensorFields(
  sensorId: string
): Promise<MonitoringSensorField[]> {
  const url = `${SENSORS_BASE}/${sensorId}/fields`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List sensor fields failed (${res.status})`);
  return res.json();
}

/**
 * Fetch a single sensor‑field by its ID
 */
export async function getSensorField(
  fieldId: string
): Promise<MonitoringSensorField> {
  const res = await fetch(`${FIELDS_BASE}/${fieldId}`);
  if (!res.ok) throw new Error(`Fetch sensor field failed (${res.status})`);
  return res.json();
}

/**
 * Create a new field under a given sensor
 */
export async function createSensorField(
  sensorId: string,
  payload: MonitoringSensorFieldCreate
): Promise<MonitoringSensorField> {
  const res = await fetch(`${SENSORS_BASE}/${sensorId}/fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create sensor field failed (${res.status}): ${txt}`);
  }
  return res.json();
}

/**
 * Update an existing sensor‑field
 */
export async function updateSensorField(
  fieldId: string,
  payload: MonitoringSensorFieldUpdate
): Promise<MonitoringSensorField> {
  const res = await fetch(`${FIELDS_BASE}/${fieldId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update sensor field failed (${res.status}): ${txt}`);
  }
  return res.json();
}

/**
 * Delete a sensor‑field
 */
export async function deleteSensorField(
  fieldId: string
): Promise<void> {
  const res = await fetch(`${FIELDS_BASE}/${fieldId}`, { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Delete sensor field failed (${res.status}): ${txt}`);
  }
}
