// app/components/ChecklistViewer.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Checkbox, Heading, Text, Textarea, VStack, HStack, Spinner, Badge, Separator, Icon, Code, Button,
  IconButton,
  Portal,
  Dialog,
  CloseButton
} from "@chakra-ui/react";
import { CheckCircle, XCircle, NotePencil } from "phosphor-react";
import { Eye } from "lucide-react";

type UUID = string;

type ExpandedChecklist = {
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

// ——— robust JSON fetcher (doesn't change your URLs)
async function safeFetchJson(url: string, init?: RequestInit) {
  const res  = await fetch(url, { cache: "no-store", ...init });
  const ct   = res.headers.get("content-type") || "";
  const body = await res.text(); // read once

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}\n${body.slice(0, 300)}`);
  }
  if (!ct.toLowerCase().includes("application/json")) {
    throw new Error(
      `Expected JSON but got "${ct || "unknown"}" from ${url}\n` +
      `Body starts with:\n${body.slice(0, 300)}`
    );
  }
  return JSON.parse(body);
}

// NOTE: URLs remain exactly how you had them
async function listChecklistsByLocation(locationId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return safeFetchJson(
    `${base}checklists/?location_id=${locationId}`
  ) as Promise<Array<{ id: string; performed_at: string }>>;
}

async function getExpandedChecklist(checklistId: string): Promise<ExpandedChecklist> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return safeFetchJson(
    `${base}checklists/${checklistId}/expanded`
  ) as Promise<ExpandedChecklist>;
}

async function addResponses(
  checklistId: string,
  responses: Array<{ template_item_id: UUID; value: boolean; comment?: string | null }>
) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return safeFetchJson(`${base}checklists/${checklistId}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(responses),
  });
}

type ChecklistViewerProps = {
  locationId: string;
  onChecklistCountChange?: (count: number) => void;
};

type DraftResponse = { value: boolean; comment?: string | null };

export default function ChecklistViewer({ locationId, onChecklistCountChange }: ChecklistViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [data, setData]       = useState<ExpandedChecklist | null>(null);
  const [draft, setDraft] = useState<Record<string, DraftResponse>>({});

  // simple debug flags (no Collapse, no extra fields on the debug object)
  const [showDebug, setShowDebug]     = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const [lastUrl, setLastUrl]         = useState<string | null>(null);
  
  useEffect(() => {
    let live = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setLastUrl(null);

        // 1) list by location
        const listUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ""}checklists/?location_id=${locationId}`;
        setLastUrl(listUrl);
        const list = await listChecklistsByLocation(locationId);
        if (!live) return;

        onChecklistCountChange?.(list.length);

        if (!list.length) {
          setData(null);
          setDraft({});
          return;
        }

        // 2) pick latest and expand
        list.sort((a, b) => +new Date(b.performed_at) - +new Date(a.performed_at));
        const expUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ""}checklists/${list[0].id}/expanded`;
        setLastUrl(expUrl);
        const expanded = await getExpandedChecklist(list[0].id);
        if (!live) return;

        setData(expanded);
        setDraft({});
      } catch (e: unknown) {
        setData(null);
        setDraft({});
        onChecklistCountChange?.(0);

        if (e instanceof Error) setError(e.message);
        else setError("Failed to load checklist");
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => { live = false; };
  }, [locationId, onChecklistCountChange]);

  const responseMap = useMemo(() => {
  const m = new Map<string, { value: boolean; comment?: string | null }>();
  data?.responses?.forEach(r =>
    m.set(r.template_item_id, { value: r.value, comment: r.comment ?? null })
  );
  return m;
}, [data]);

  const savePayload = useMemo(() => {
    if (!data) return [];
    return data.categories.flatMap(cat =>
      cat.items.map(item => ({
        checklist_id: data.id,
        template_item_id: item.id,
        value: draft[item.id]?.value ?? false,
        comment: draft[item.id]?.comment ?? null,
      }))
    );
  }, [data, draft]);

  const handleSave = async () => {
    if (!data) return;
    try {
      await addResponses(data.id, savePayload);
      // refetch to sync
      const fresh = await getExpandedChecklist(data.id);
      setData(fresh);

      const seeded: Record<string, DraftResponse> = {};
      fresh.responses.forEach(r => {
        seeded[r.template_item_id] = {
          value: r.value,
          comment: r.comment ?? null,
        };
      });
      setDraft(seeded);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <Box p={4} h="100%" display="flex" alignItems="center" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  if (error) {
    // plain inline error box (no Alert/Collapse)
    return (
      <Box p={4} borderWidth="1px" borderRadius="md" bg="bg.subtle">
        <Text fontWeight="bold">Checklist request failed</Text>
        {lastUrl && (
          <Text mt={1} fontSize="sm" wordBreak="break-all">
            URL: <Code>{lastUrl}</Code>
          </Text>
        )}
        <Text mt={2} whiteSpace="pre-wrap" color="fg.muted">{error}</Text>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={4}>
        <Heading size="sm" mb={2}>Checklist</Heading>
        <Text color="fg.muted">No checklists found for this location.</Text>
      </Box>
    );
  }

  const noResponses = (data.responses?.length ?? 0) === 0;
  const categories  = data.categories ?? [];

  return (
    <Box p={4}>
      <HStack justify="space-between" align="baseline" mb={2}>
        <Heading size="sm">{data.template_name}</Heading>
        <Badge>
          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })
            .format(new Date(data.performed_at))}
        </Badge>
      </HStack>

      {data.notes && (
        <HStack mb={3} gap={2}>
          <Icon as={NotePencil} />
          <Text fontSize="sm">{data.notes}</Text>
        </HStack>
      )}

      {noResponses ?  (
        <Box mb={2} p={3} borderWidth="1px" borderRadius="md" bg="bg.subtle">
          <Text fontSize="sm">No responses recorded yet.</Text>
        </Box>
      ) : <Box mb={2} p={3} borderWidth="1px" borderRadius="md" bg="bg.subtle">
            <Text fontSize="sm" textAlign={"center"}>Last Response
              <Dialog.Root key="prev" size="md">
                <Dialog.Trigger asChild>
                <IconButton
                aria-label="View last response"
                variant="ghost"
                size="xs"
                
              >
                <Icon as={Eye} />
              </IconButton>
              </Dialog.Trigger>
              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content maxH="80vh" overflow="hidden" border="2px solid">
                    <Dialog.Header>
                      <Box flex="1">
                        <Dialog.Title>
                          Last Response — {data.template_name}
                        </Dialog.Title>
                        <Dialog.Description mt="1" fontSize="sm" color="fg.muted">
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(data.performed_at))}
                        </Dialog.Description>
                      </Box>
                    </Dialog.Header>

                    <Dialog.Body maxH="65vh" overflowY="auto">
                      <VStack align="stretch" gap={3}>
                        {categories.map((cat) => (
                          <Box key={cat.id} borderWidth="1px" borderRadius="md" p={3} bg="bg.subtle">
                            <Heading size="xs" mb={2}>
                              {cat.title}
                            </Heading>

                            <VStack align="stretch" gap={2}>
                              {cat.items.map((item) => {
                                const r = responseMap.get(item.id);

                                return (
                                  <Box key={item.id}>
                                    <HStack justify="space-between" align="start">
                                      <Text>{item.prompt}</Text>
                                      <HStack minW="80px" justify="flex-end">
                                        {r ? (
                                          r.value ? (
                                            <HStack>
                                              <Icon as={CheckCircle} color="green" />
                                              <Text>Yes</Text>
                                            </HStack>
                                          ) : (
                                            <HStack>
                                              <Icon as={XCircle} color="red" />
                                              <Text>No</Text>
                                            </HStack>
                                          )
                                        ) : (
                                          <Text color="fg.muted">—</Text>
                                        )}
                                      </HStack>
                                    </HStack>

                                    {r?.comment && (
                                      <Text mt={1} fontSize="sm" color="fg.muted" pl={4}>
                                        {r.comment}
                                      </Text>
                                    )}

                                    <Separator my="2" />
                                  </Box>
                                );
                              })}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Dialog.ActionTrigger asChild>
                        <Button variant="outline">Close</Button>
                      </Dialog.ActionTrigger>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                      <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>
          </Text>
        </Box>
      }

      <VStack align="stretch" gap={2}>
        {categories.map(cat => {
          const items = cat.items ?? [];
          return (
            <Box key={cat.id} borderWidth="1px" borderRadius="md" p={3} bg="bg.subtle">
              <Heading size="xs" mb={2}>{cat.title}</Heading>

              <VStack align="stretch" gap={3}>
                {items.map(item => {
                  const r = draft[item.id];
                  const answered = r !== undefined;

                  return (
                    <Box key={item.id}>
                      {item.response_type === "yes_no" ? (
                        <HStack justify="space-between" align="center">
                          <Checkbox.Root
                            checked={r?.value ?? false}
                            onCheckedChange={(e) =>
                              setDraft(prev => ({
                                ...prev,
                                [item.id]: {
                                  value: e.checked === true,
                                  comment: prev[item.id]?.comment ?? null,
                                },
                              }))
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>

                          <Text
                            flex="1"
                            ml={2}
                            color={answered ? "fg" : "fg.muted"}
                            fontStyle={answered ? "normal" : "italic"}
                          >
                            {item.prompt}
                          </Text>

                          <HStack minW="80px" justify="flex-end">
                            {answered ? (
                              r?.value ? (
                                <HStack><Icon as={CheckCircle} color="green"/><Text>Yes</Text></HStack>
                              ) : (
                                <HStack><Icon as={XCircle} color="red"/><Text>No</Text></HStack>
                              )
                            ) : (
                              <HStack><Icon as={XCircle} color="red"/><Text>No</Text></HStack>
                            )}
                          </HStack>
                        </HStack>
                      ) : (
                        <Box>
                          <Text
                            fontWeight="medium"
                            color={answered ? "fg" : "fg.muted"}
                            fontStyle={answered ? "normal" : "italic"}
                          >
                            {item.prompt}
                          </Text>

                          <Textarea
                            mt={2}
                            value={r?.comment ?? ""}
                            onChange={(e) => {
                              const text = e.target.value;
                              setDraft(prev => ({
                                ...prev,
                                [item.id]: {
                                  value: text.trim().length > 0,
                                  comment: text,
                                },
                              }));
                            }}
                          />
                        </Box>
                      )}

                      {r?.comment && item.response_type === "yes_no" && (
                        <Text mt={1} fontSize="sm" color="fg.muted" pl={6}>
                          {r.comment}
                        </Text>
                      )}

                      <Separator my="2" />
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          );
        })}
      </VStack>

      {/* ✅ ADD Save button */}
      <HStack mt={4} justify="flex-end">
        <Button onClick={handleSave} colorScheme="yellow">
          Save Responses
        </Button>
      </HStack>

      {/* lightweight debug (no Collapse) */}
      <Box mt={4}>
        <HStack gap={2}>
          <Button size="sm" variant="ghost" onClick={() => setShowDebug(v => !v)}>
            {showDebug ? "Hide debug" : "Show debug"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowPayload(v => !v)}>
            {showPayload ? "Hide payload" : "Show payload"}
          </Button>
        </HStack>

        {showDebug && (
          <Box mt={2} p={2} borderWidth="1px" borderRadius="md" maxH="200px" overflow="auto">
            <Heading size="xs" mb={1}>Debug</Heading>
            <Text fontSize="sm" wordBreak="break-all">
              Last URL: <Code>{lastUrl ?? "-"}</Code>
            </Text>
          </Box>
        )}

        {showPayload && (
          <Box mt={2} p={2} borderWidth="1px" borderRadius="md" maxH="320px" overflow="auto">
            <Heading size="xs" mb={1}>Raw payload</Heading>
            <Code as="pre" display="block" whiteSpace="pre">
              {JSON.stringify(data, null, 2)}
            </Code>
          </Box>
        )}
      </Box>
    </Box>
  );
}