// File: src/services/checklists.ts
import type { Checklist, ChecklistPayload, ChecklistExpanded, UUID, ChecklistTemplate } from "@/types/checklist";

const API_ROOT = process.env.NEXT_PUBLIC_API_URL!;
const BASE     = `${API_ROOT}checklists`;

async function readBody(res: Response) {
  return res.text().then((t) => t || "");
}

export async function listChecklists(locationId: string): Promise<Checklist[]> {
  const res = await fetch(`/api/checklists?location_id=${locationId}`);
  if (!res.ok) throw new Error("Failed to fetch checklists");
  return res.json();
}

export async function listChecklistsForLocation(locationId: UUID): Promise<Checklist[]> {
  const res = await fetch(`${BASE}/?location_id=${locationId}`);
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(`List checklists failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<Checklist[]>;
}

export async function getChecklist(checklistId: UUID): Promise<Checklist> {
  const res = await fetch(`${BASE}/${checklistId}`);
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(`Get checklist failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<Checklist>;
}

export async function getExpandedChecklist(checklistId: UUID): Promise<ChecklistExpanded> {
  const res = await fetch(`${BASE}/${checklistId}/expanded`);
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(`Get expanded checklist failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<ChecklistExpanded>;
}

export async function createChecklist(
  payload: ChecklistPayload & { location_id: UUID; template_id: UUID }
): Promise<Checklist> {
  const res = await fetch(`${BASE}/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(`Create checklist failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<Checklist>;
}

export async function addResponses(
  checklistId: UUID,
  responses: Array<{ template_item_id: UUID; value: boolean; comment?: string | null }>
): Promise<Array<{ id: UUID; checklist_id: UUID; template_item_id: UUID; value: boolean; comment?: string | null; created_at: string }>> {
  const res = await fetch(`${BASE}/${checklistId}/responses`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(responses),
  });
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(`Add responses failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function listResponses(
  checklistId: UUID
): Promise<Array<{ id: UUID; checklist_id: UUID; template_item_id: UUID; value: boolean; comment?: string | null; created_at: string }>> {
  const res = await fetch(`${BASE}/${checklistId}/responses`);
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(`List responses failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function getLatestExpandedByLocation(locationId: UUID): Promise<ChecklistExpanded | null> {
  const list = await listChecklistsForLocation(locationId);
  if (!list.length) return null;
  list.sort((a, b) => +new Date(b.performed_at) - +new Date(a.performed_at));
  return getExpandedChecklist(list[0].id);
}

export async function deleteChecklist(checklistId: UUID): Promise<void> {
  const res = await fetch(`${BASE}/${checklistId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await readBody(res);
    throw new Error(`Delete checklist failed (${res.status}): ${body}`);
  }
}

export async function deleteChecklistsForLocation(locationId: UUID): Promise<void> {
  const res = await fetch(`${BASE}/?location_id=${locationId}`, { method: "DELETE" });
  if (res.ok) return;

  // fallback requires single-id DELETE to exist:
  const list = await listChecklistsForLocation(locationId);
  await Promise.all(list.map(cl => deleteChecklist(cl.id)));
}

export async function listChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const res = await fetch(`${BASE}/templates`);
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json() as Promise<ChecklistTemplate[]>;
}