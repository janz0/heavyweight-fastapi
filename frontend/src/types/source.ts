// File: types/source.ts
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject;
interface JsonObject { [key: string]: JsonValue; }

export interface Source {
  id: string;
  mon_loc_id: string;
  source_name: string;
  folder_path: string;
  file_keyword: string;
  file_type: string;
  source_type: string;
  config: string;
  last_data_upload: string;
  active: number;
  last_updated: string;        // ISO-formatted timestamp (e.g. "2025-06-05T12:34:56Z")
  root_directory: string;

  details?: {
    loc_number?: string;
    loc_name:    string;
    project_id: string;
    project_number?: string;
    project_name: string;
  };
}

export interface SourcePayload {
  mon_loc_id?: string;
  source_name?: string;
  folder_path?: string;
  file_keyword?: string;
  file_type?: string;
  source_type?: string;
  config?: string;
  active?: number;
  root_directory?: string;
}

/**
 * Payload sent to POST /monitoring-sources/ in order to create a new Source.
 */
export interface SourceCreatePayload {
  mon_loc_id: string;
  source_name: string;
  folder_path: string;
  file_keyword: string;
  file_type: string;
  source_type: string;
  config: string;
  active: number;
  root_directory: string;
}

/**
 * Payload sent to PATCH /monitoring-sources/{source_id} in order to update a Source.
 */
export interface SourceUpdatePayload {
  source_name?: string;
  status?: string;
}
