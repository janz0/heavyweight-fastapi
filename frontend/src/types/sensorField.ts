// File: src/types/sensorField.ts

export interface MonitoringSensorFieldBase {
  field_name: string;
  uom?: string;
  is_calculated?: boolean;
  field_type?: string;
}

export interface MonitoringSensorFieldCreate {
  field_name: string;
  uom?: string;
  is_calculated?: boolean;
  field_type?: string;
}

export interface MonitoringSensorFieldUpdate {
  field_name?: string;
  uom?: string;
  is_calculated?: boolean;
  field_type?: string;
}

export interface MonitoringSensorField extends MonitoringSensorFieldBase {
  id: string;
  sensor_id: string;
}
