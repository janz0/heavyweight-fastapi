import type {
  MonitoringSensorData,
  MonitoringSensorDataCreate,
  MonitoringSensorDataUpdate,
  MonitoringSensorDataBulkRequest
} from "@/types/sensorData";

const API = process.env.NEXT_PUBLIC_API_URL;
const BASE = `${API}monitoring-sensor-data`;

/**
 * List sensor data entries (paginated)
 */
export async function listSensorData(
  skip = 0,
  limit = 100
): Promise<MonitoringSensorData[]> {
  const url = `${BASE}/?skip=${skip}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List sensor data failed (${res.status})`);
  return res.json();
}

/**
 * Fetch all (or paginated) sensor‐data and filter to a single field.
 * If your API eventually supports a `?sensor_field_id=…` query you can swap this out.
 */
export async function listSensorDataByField(
  sensorFieldId: string,
  skip = 0,
  limit = 1000
): Promise<MonitoringSensorData[]> {
  // pull a batch of records…
  const all = await listSensorData(skip, limit);
  // …then filter in‐JS
  return all.filter((r) => r.sensor_field_id === sensorFieldId);
}

/**
 * Get a single data point by sensor_field_id and timestamp
 */
export async function getSensorDataEntry(
  sensorFieldId: string,
  timestamp: string
): Promise<MonitoringSensorData> {
  const ts = encodeURIComponent(timestamp);
  const res = await fetch(`${BASE}/${sensorFieldId}/${ts}`);
  if (!res.ok) throw new Error(`Fetch sensor data failed (${res.status})`);
  return res.json();
}

/**
 * Create a new sensor‑data entry
 */
export async function createSensorData(
  payload: MonitoringSensorDataCreate
): Promise<MonitoringSensorData> {
  const res = await fetch(`${BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create sensor data failed (${res.status}): ${txt}`);
  }
  return res.json();
}

/**
 * Update an existing sensor‑data entry
 */
export async function updateSensorData(
  sensorFieldId: string,
  timestamp: string,
  payload: MonitoringSensorDataUpdate
): Promise<MonitoringSensorData> {
  const ts = encodeURIComponent(timestamp);
  const res = await fetch(`${BASE}/${sensorFieldId}/${ts}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update sensor data failed (${res.status}): ${txt}`);
  }
  return res.json();
}

/**
 * Delete a sensor‑data entry
 */
export async function deleteSensorData(
  sensorFieldId: string,
  timestamp: string
): Promise<void> {
  const ts = encodeURIComponent(timestamp);
  const res = await fetch(`${BASE}/${sensorFieldId}/${ts}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Delete sensor data failed (${res.status}): ${txt}`);
  }
}

/**
 * Bulk ingest sensor data from a source
 */
export async function createBulkSensorData(
  payload: MonitoringSensorDataBulkRequest
): Promise<{ status: string; records_enqueued: number }> {
  const res = await fetch(`${BASE}/bulk-from-source`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Bulk create sensor data failed (${res.status}): ${txt}`);
  }
  return res.json();
}
