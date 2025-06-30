// File: types/location.ts

export interface Location {
  id: string;
  project_id: string;         // ties to Project.id
  project_name?: string;
  loc_name: string;      // or whatever you call it
  loc_number: string | null;
  lat: number;
  lon: number;
  frequency: string;          // e.g. "5m", "1h", or you could use number
  active: number | 1;            // or 0/1 if you prefer
  created_at: string;         // ISO timestamp
  last_updated: string;       // ISO timestamp
  last_inspected: string | null; //ISON timestamp
}

// And the payload you send when creating/updating:
export interface LocationPayload {
  project_id?:   string;
  loc_name?: string;
  loc_number?: string;
  lat?:     number;
  lon?:    number;
  frequency?:    string;
  active?:       number;
}
