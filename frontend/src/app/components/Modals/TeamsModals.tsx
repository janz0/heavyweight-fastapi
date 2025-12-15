"use client";

import { FormEvent, useState, useEffect } from "react";
import {
  Button,
  Box,
  CloseButton,
  Dialog,
  Field,
  Input,
  Text,
  VStack,
  HStack,
  Spinner,
  Flex,
  Table,
  InputGroup,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { createTeam, listTeams } from "@/services/teams";
import type { Team } from "@/types/teams";
import { Plus } from "lucide-react";
import { MagnifyingGlass } from "phosphor-react";
import { useAuth } from "@/lib/auth";

interface TeamCreateModalProps {
  trigger: React.ReactElement;
  onCreated?: (team: Team) => void;
}

interface TeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",   // e.g. "Dec"
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeamCreateModal({ trigger, onCreated }: TeamCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { authToken } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toaster.create({
        description: "Team name is required",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTeam({ name: name.trim() }, authToken);
      toaster.create({
        description: "Team created",
        type: "success",
      });
      onCreated?.(created);
      setOpen(false);
      setName("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create team";
      toaster.create({
        description: message,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      size="sm"
      open={open}
      onOpenChange={({ open }) => setOpen(open)}
    >
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>

      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content border="2px solid">
          <Dialog.Header>
            <Dialog.Title>Create Team</Dialog.Title>
          </Dialog.Header>

          <form onSubmit={handleSubmit}>
            <Dialog.Body>
              <Field.Root required mb={4}>
                <Field.Label>Team Name</Field.Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" mr={3}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorScheme="yellow"
                type="submit"
                loading={submitting}
              >
                Create
              </Button>
            </Dialog.Footer>
          </form>

          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export function TeamsModal({ isOpen, onClose }: TeamsModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedView, setSelectedView] = useState<"all" | string>("all"); // "all" or team.id
  const { authToken } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    listTeams(authToken)
      .then((data) => setTeams(data))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load teams";
        toaster.create({ description: msg, type: "error" });
      })
      .finally(() => setLoading(false));
  }, [isOpen, authToken]);

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTeam =
    selectedView !== "all"
      ? teams.find((t) => t.id === selectedView) ?? null
      : null;

  const headerTitle = selectedView === "all"
    ? "All teams"
    : selectedTeam?.name ?? "Team";

  return (
    <Dialog.Root
      size="cover"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content border="2px solid" maxH="80vh" overflowY="auto">
          <Dialog.Header>
            <Dialog.Title>Teams</Dialog.Title>
          </Dialog.Header>

          <Flex h="full" align="stretch">
            {/* ───── Sidebar (1/5) ───── */}
            <Box
              w="20%"
              minW="220px"
              borderRightWidth="1px"
              borderColor="border.muted"
              p={3}
            >
              <VStack align="stretch" gap={3}>
                {/* New team button (opens nested create modal) */}
                <TeamCreateModal
                  onCreated={(t) => {
                    setTeams((prev) => [t, ...prev]);
                    setSelectedView("all"); // keep on All teams
                  }}
                  trigger={
                    <Button
                      w="full"
                      justifyContent="center"
                      size="sm"
                      variant="outline"
                    >
                      <Plus size={14} />
                      New team
                    </Button>
                  }
                />

                {/* Search */}
                <Box>
                  <InputGroup startElement={<MagnifyingGlass />}>
                    <Input
                      size="sm"
                      placeholder="Search Teams"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Box>

                {/* "All teams" nav item */}
                <Box>
                  <Button
                    size="sm"
                    variant={selectedView === "all" ? "solid" : "ghost"}
                    w="full"
                    justifyContent="flex-start"
                    colorScheme={selectedView === "all" ? "blue" : undefined}
                    onClick={() => setSelectedView("all")}
                  >
                    All teams
                  </Button>
                </Box>

                {/* List of teams */}
                <Box flex="1" overflowY="auto">
                  <Text fontSize="xs" mb={1} color="gray.500">
                    Teams
                  </Text>
                  <VStack align="stretch" gap={1} maxH="40vh" overflowY="auto">
                    {loading && (
                      <HStack justify="center" py={2}>
                        <Spinner size="xs" />
                        <Text fontSize="xs">Loading…</Text>
                      </HStack>
                    )}

                    {!loading && filteredTeams.length === 0 && (
                      <Text fontSize="xs" color="gray.500">
                        No teams found.
                      </Text>
                    )}

                    {!loading &&
                      filteredTeams.map((team) => (
                        <Button
                          key={team.id}
                          size="sm"
                          variant={
                            selectedView === team.id ? "solid" : "ghost"
                          }
                          w="full"
                          justifyContent="flex-start"
                          colorScheme={
                            selectedView === team.id ? "blue" : undefined
                          }
                          onClick={() => setSelectedView(team.id)}
                        >
                          {team.name}
                        </Button>
                      ))}
                  </VStack>
                </Box>
              </VStack>
            </Box>

            {/* ───── Main area (4/5) ───── */}
            <Box flex="1" p={4} overflow="auto">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                {headerTitle}
              </Text>

              {loading ? (
                <HStack justify="center" py={8}>
                  <Spinner />
                  <Text>Loading teams…</Text>
                </HStack>
              ) : (
                <>
                  {selectedView === "all" ? (
                    <Table.Root size="sm" variant="outline">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Name</Table.ColumnHeader>
                          <Table.ColumnHeader w="35%">Created</Table.ColumnHeader>
                          <Table.ColumnHeader w="35%">Updated</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {filteredTeams.map((team) => (
                          <Table.Row key={team.id}>
                            <Table.Cell>{team.name}</Table.Cell>
                            <Table.Cell whiteSpace="nowrap">
                              {formatDateTime(team.created_at)}
                            </Table.Cell>
                            <Table.Cell whiteSpace="nowrap">
                              {formatDateTime(team.last_updated)}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                        {filteredTeams.length === 0 && (
                          <Table.Row>
                            <Table.Cell colSpan={3}>
                              <Text fontSize="sm" color="gray.500">
                                No teams to display.
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                        )}
                      </Table.Body>
                    </Table.Root>
                  ) : (
                    // Simple detail view for a single team (you can expand later)
                    <Box>
                      {!selectedTeam ? (
                        <Text fontSize="sm" color="gray.500">
                          Team not found.
                        </Text>
                      ) : (
                        <>
                          <Text fontWeight="semibold" mb={2}>
                            {selectedTeam.name}
                          </Text>
                          <Table.Root size="sm" variant="outline">
                            <Table.Body>
                              <Table.Row>
                                <Table.ColumnHeader w="150px">Name</Table.ColumnHeader>
                                <Table.Cell>{selectedTeam.name}</Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.ColumnHeader>Created</Table.ColumnHeader>
                                <Table.Cell>{selectedTeam.created_at}</Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.ColumnHeader>Updated</Table.ColumnHeader>
                                <Table.Cell>{selectedTeam.last_updated}</Table.Cell>
                              </Table.Row>
                            </Table.Body>
                          </Table.Root>
                        </>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Flex>

          <Dialog.Footer>
            <Button variant="outline" ml="auto" onClick={onClose}>
              Close
            </Button>
          </Dialog.Footer>

          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}