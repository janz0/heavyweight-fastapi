// app/components/ChecklistViewer.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Heading, Text, VStack, HStack, Spinner, Badge, Separator, Icon, Code, Button
} from "@chakra-ui/react";
import { CheckCircle, XCircle, NotePencil } from "phosphor-react";

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

export default function ChecklistViewer({ locationId }: { locationId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [data, setData]       = useState<ExpandedChecklist | null>(null);

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

        if (!list.length) {
          setData(null);
          return;
        }

        // 2) pick latest (defensive) and expand
        list.sort((a, b) => +new Date(b.performed_at) - +new Date(a.performed_at));
        const expUrl = `${process.env.NEXT_PUBLIC_API_BASE ?? ""}checklists/${list[0].id}/expanded`;
        setLastUrl(expUrl);
        const expanded = await getExpandedChecklist(list[0].id);
        if (!live) return;

        setData(expanded);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to load checklist");
        }
        setData(null);
      } finally {
        if (live) {
          setLoading(false);
        }
      }
    })();
    return () => { live = false; };
  }, [locationId]);

  // Map responses by template_item_id (works if responses is [])
  const responseMap = useMemo(() => {
    const m = new Map<string, { value: boolean; comment?: string | null }>();
    data?.responses?.forEach(r => m.set(r.template_item_id, { value: r.value, comment: r.comment }));
    return m;
  }, [data?.responses]);

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
    <Box p={4} h="100%" overflow="auto">
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

      {noResponses && (
        <Box mb={4} p={3} borderWidth="1px" borderRadius="md" bg="bg.subtle">
          <Text fontSize="sm">No responses recorded yet. Showing template questions.</Text>
        </Box>
      )}

      <VStack align="stretch" gap={4}>
        {categories.map(cat => {
          const items = cat.items ?? [];
          return (
            <Box key={cat.id} borderWidth="1px" borderRadius="md" p={3}>
              <Heading size="xs" mb={2}>{cat.title}</Heading>
              <VStack align="stretch" gap={2}>
                {items.map(item => {
                  const r = responseMap.get(item.id);
                  const isYes = r?.value === true;

                  return (
                    <Box key={item.id}>
                      <HStack justify="space-between" align="start">
                        <Text>{item.prompt}</Text>
                        <HStack minW="80px" justify="flex-end">
                          {r
                            ? (isYes
                                ? <HStack><Icon as={CheckCircle} /><Text>Yes</Text></HStack>
                                : <HStack><Icon as={XCircle} /><Text>No</Text></HStack>)
                            : <Text color="fg.muted">—</Text>}
                        </HStack>
                      </HStack>

                      {r?.comment && (
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
