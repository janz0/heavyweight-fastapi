// File: types/project.ts

export interface Project {
  id: string;
  project_number: string;
  project_name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  active: number;
  created_at: string;
  last_updated: string;
  locations_count: number;
}

export interface ProjectPayload {
  project_name: string;
  description: string;
  start_date: string;
  active: number;
  status: string;
  project_number: string;
  end_date?: string;
}
