// File: types/source.ts

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject;
interface JsonObject { [key: string]: JsonValue; }

/**
 * Represents a “Monitoring Source” as returned by the FastAPI backend.
 * Note: The backend’s schemas.Source likely includes project_id and location_id,
 * and uses a numeric `id` instead of a string. Adjust field names/types as needed
 * if your backend schema differs.
 */
export interface Source {
  id: number;                // FastAPI returns an integer ID
  project_id: string;        // The UUID (or string) of the parent project
  location_id: string;       // The UUID (or string) of the parent location
  source_name: string;       // The name of this source
  folder_path: string;
  file_keyword: string;
  file_type: string;
  source_type: string;
  config: JsonObject;
  last_data_upload: JsonObject;
  active: number;
  last_updated: string;        // ISO-formatted timestamp (e.g. "2025-06-05T12:34:56Z")
  // Add any other fields that your backend’s schemas.Source actually returns
}

/**
 * Payload sent to POST /monitoring-sources/ in order to create a new Source.
 * Make sure these fields line up with your FastAPI `schemas.SourceCreate`.
 */
export interface SourceCreatePayload {
  project_id: string;
  location_id: string;
  source_name: string;
  status: string;
  // Include any other required properties from schemas.SourceCreate
}

/**
 * Payload sent to PATCH /monitoring-sources/{source_id} in order to update a Source.
 * All fields are optional here (you only send the ones you intend to change).
 * Adjust names/types to match your FastAPI `schemas.SourceUpdate`.
 */
export interface SourceUpdatePayload {
  source_name?: string;
  status?: string;
  // Include any other updatable fields from schemas.SourceUpdate
}
