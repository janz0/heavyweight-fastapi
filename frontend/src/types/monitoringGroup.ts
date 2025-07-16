// File: types/monitoringGroup.ts

export interface MonitoringGroup {
  id: string;
  mon_loc_id: string;
  group_name: string;
  group_type: string;
  data?: Record<string, unknown>;
  status?: string;
  active: number;
  created_at: string;
  last_updated: string;
}

export interface MonitoringGroupPayload {
  mon_loc_id?: string;
  group_name?: string;
  group_type?: string;
  data?: Record<string, unknown>;
  active?: number;
}
