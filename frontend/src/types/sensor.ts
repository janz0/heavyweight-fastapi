// File: types/sensor.ts
export interface MonitoringSensor {
  id: string;
  mon_source_id: string;
  source_name?: string;
  sensor_group_id?: string;
  sensor_name: string;
  sensor_type: string;
  active: number;
  created_at: string;
  last_updated: string;
}

export interface MonitoringSensorPayload {
  mon_source_id?: string;
  sensor_group_id?: string;
  sensor_name?: string;
  sensor_type?: string;
  active?: number;
}