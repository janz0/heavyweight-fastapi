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

// Optional create/update payload types
export interface MonitoringSensorCreate {
  mon_source_id: string;
  sensor_group_id: string;
  sensor_name: string;
  sensor_type: string;
  active?: number;
}

export interface MonitoringSensorUpdate {
  mon_source_id?: string;
  sensor_group_id?: string;
  sensor_name?: string;
  sensor_type?: string;
  active?: number;
}