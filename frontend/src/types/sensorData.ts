// TypeScript interfaces for monitoring‐sensor‐data

export interface MonitoringSensorDataBase {
  mon_loc_id: string;
  sensor_id: string;
  sensor_field_id: string;
  timestamp: string;      // ISO 8601
  data: number;
  is_approved?: boolean;
}

export interface MonitoringSensorDataCreate {
  mon_loc_id: string;
  sensor_id: string;
  sensor_field_id: string;
  timestamp: string;      // ISO 8601
  data: number;
  is_approved?: boolean;
}

export interface MonitoringSensorDataUpdate {
  data?: number;
  is_approved?: boolean;
}

export interface MonitoringSensorData extends MonitoringSensorDataBase {
  last_updated: string;   // ISO 8601
}

// Bulk ingestion types:

export interface FieldValueRaw {
  field: string;   // sensor_field_id
  value: number;
}

export interface SensorDataRaw {
  sensor: string;                // sensor_id
  data: FieldValueRaw[];
}

export interface BulkSensorDataItem {
  timestamp: string;             // ISO 8601
  source_id: string;
  mon_loc_id: string;
  sensor_type: string;
  sensors: SensorDataRaw[];
}

export interface MonitoringSensorDataBulkRequest {
  items: BulkSensorDataItem[];
}
