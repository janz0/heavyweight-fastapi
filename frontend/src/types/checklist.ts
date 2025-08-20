export type UUID = string;

export interface Checklist {
  id: UUID;
  location_id: UUID;
  template_id: UUID;
  performed_at: string;     // ISO timestamp
  created_by?: UUID | null;
  notes?: string | null;
}

export interface ChecklistPayload {
  location_id?: UUID;
  template_id?: UUID;
  performed_at?: string;
  created_by?: UUID | null;
  notes?: string | null;
}

export type ChecklistExpanded = {
  id: UUID;
  template_id: UUID;
  template_name: string;
  performed_at: string;
  notes?: string | null;
  categories: Array<{
    id: UUID;
    title: string;
    sort_order: number;
    items: Array<{
      id: UUID;
      prompt: string;
      response_type: "yes_no" | "text";
      sort_order: number;
    }>;
  }>;
  responses: Array<{
    id: UUID;
    checklist_id: UUID;
    template_item_id: UUID;
    value: boolean;
    comment?: string | null;
    created_at: string;
  }>;
};