// File: types/teams.ts

export interface Team {
  id: string;
  name: string;
  created_at: string; // date
  last_updated: string; // date
}

export interface TeamCreatePayload {
  name: string;
}