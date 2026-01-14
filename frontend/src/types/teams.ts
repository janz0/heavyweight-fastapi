// File: types/teams.ts

export interface Team {
  id: string;
  name: string;
  members_count: number;
  created_at: string; // date
  last_updated: string; // date
}

export interface TeamCreatePayload {
  name: string;
}