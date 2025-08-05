// File: app/locations/components/MonitoringGroupModals.tsx
'use client';

import React, { FormEvent, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  CloseButton,
  createListCollection,
  Dialog,
  Field,
  Flex,
  IconButton,
  Input,
  Text,
  Portal,
  Switch,
  Select,
  Box,
  Table,
  Checkbox,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { X } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";
import {
  createMonitoringGroup,
  //updateMonitoringGroup,
  deleteMonitoringGroup,
  listMonitoringGroups,
} from "@/services/monitoringGroups";
import type {
  MonitoringGroup,
  MonitoringGroupPayload,
} from "@/types/monitoringGroup";
import { listLocations } from "@/services/locations";
import type { Location } from "@/types/location";
import { MonitoringSensor } from "@/types/sensor";
import { Source } from "@/types/source";
import { listSensors } from "@/services/sensors";
import { listSources } from "@/services/sources";

// ==============================
// Shared Form Component
// ==============================
function MonitoringGroupForm({
  onSubmit,
  onClose,
  initialData,
  initialLocationId,
  submitLabel,
}: {
  onSubmit: (payload: MonitoringGroupPayload) => Promise<void>;
  onClose: () => void;
  initialData?: MonitoringGroup;
  initialLocationId?: string;
  submitLabel: string;
}) {
  const { colorMode } = useColorMode();
  const bc = colorMode === "light" ? "black" : "white";

  const fixedLocationId = initialLocationId ?? initialData?.mon_loc_id;
  const isLocked = Boolean(fixedLocationId);

  const router = useRouter();
  const [groupName, setGroupName] = useState(initialData?.group_name ?? "");
  const [groupType, setGroupType] = useState(initialData?.group_type ?? "");
  const [active, setActive] = useState(
    initialData ? initialData.active === 1 : true
  );

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>(
    fixedLocationId ? [fixedLocationId] : []
  );

  useEffect(() => {
    listLocations()
      .then(setLocations)
      .catch((err) => {
        console.error(err);
        toaster.create({ type: "error", description: "Could not load locations" });
      });
  }, []);
  const locationCollection = useMemo(
    () =>
      createListCollection({
        items: locations.map((l) => ({ label: l.loc_name, value: l.id })),
      }),
    [locations]
  );

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.group_name);
      setGroupType(initialData.group_type);
      setActive(initialData.active === 1);
    } else {
      setGroupName("");
      setGroupType("");
      setActive(true);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!locationIds[0]) {
      toaster.create({
        type: "error",
        description: "You must select a location.",
      });
      return;
    }
    const payload: MonitoringGroupPayload = {
      mon_loc_id: locationIds[0],
      group_name: groupName,
      group_type: groupType,
      data: {},
      active: active ? 1 : 0,
    };
    await onSubmit(payload);
    router.refresh();
  };

  return (
    <form id="group-form" onSubmit={handleSubmit}>
      <Field.Root required mb={4}>
        <Field.Label>Location</Field.Label>
        <Select.Root
          collection={locationCollection}
          value={locationIds}
          onValueChange={(e) => setLocationIds(e.value)}
          disabled={isLocked}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger borderColor={bc}>
              <Select.ValueText
                placeholder={
                  isLocked ? undefined : "Select a location"
                }
              />
            </Select.Trigger>
            <Select.IndicatorGroup>
              {!isLocked && <Select.ClearTrigger />}
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {locationCollection.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Field.Root>
      <Field.Root required mb={4}>
        <Field.Label>Group Name</Field.Label>
        <Input
          value={groupName}
          borderColor={bc}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </Field.Root>
      <Field.Root required mb={4}>
        <Field.Label>Group Type</Field.Label>
        <Input
          value={groupType}
          borderColor={bc}
          onChange={(e) => setGroupType(e.target.value)}
        />
      </Field.Root>
      <Field.Root justifyItems="center" mb={4}>
        <Flex gap="2" align="center">
          <Field.Label>Active</Field.Label>
          <Switch.Root
            checked={active}
            onCheckedChange={({ checked }) => setActive(checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control _checked={{ bg: "green.400" }}>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Flex>
      </Field.Root>
      <Dialog.Footer>
        <Button colorScheme="gray" mr={3} type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button colorScheme="blue" type="submit">
          {submitLabel}
        </Button>
      </Dialog.Footer>
    </form>
  );
}

// ==============================
// CreateMonitoringGroupModal
// ==============================
export function MonitoringGroupCreateModal({
  isOpen,
  onClose,
  locationId,
}: {
  isOpen: boolean;
  onClose: () => void;
  locationId?: string;
}) {
  const handleCreate = async (payload: MonitoringGroupPayload) => {
    try {
      await createMonitoringGroup(payload);
      toaster.create({ type: "success", description: "Group created successfully" });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toaster.create({
        type: "error",
        description: `Create failed: ${message}`,
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>New Sensor Group</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  onClick={onClose}
                ><X size={16} /></IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <MonitoringGroupForm
                onSubmit={handleCreate}
                onClose={onClose}
                initialLocationId={locationId}
                submitLabel="Create"
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// EditMonitoringGroupModal
// ==============================
export function MonitoringGroupEditModal({
  isOpen,
  onClose,
  group,
}: {
  isOpen: boolean;
  onClose: () => void;
  group?: MonitoringGroup;
}) {
  const handleUpdate = async (payload: MonitoringGroupPayload) => {
    if (!group) return;
    try {
      await createMonitoringGroup(payload);
      toaster.create({ type: "success", description: "Group created successfully" });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toaster.create({
        type: "error",
        description: `Create failed: ${message}`,
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()} size="sm">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Edit Sensor Group</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  onClick={onClose}
                ><X size={16} /></IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <MonitoringGroupForm
                onSubmit={handleUpdate}
                onClose={onClose}
                initialData={group}
                submitLabel="Save"
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// DeleteMonitoringGroupModal
// ==============================
export function MonitoringGroupDeleteModal({
  isOpen,
  onClose,
  group,
}: {
  isOpen: boolean;
  onClose: () => void;
  group?: MonitoringGroup;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!group) return;
    try {
      await deleteMonitoringGroup(group.id);
      toaster.create({ type: "success", description: "Group deleted" });
      onClose();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toaster.create({
        type: "error",
        description: `Delete failed: ${message}`,
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()} size="sm">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete Sensor Group</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete{" "}
              <strong>{group?.group_name}</strong>?
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} mr={3}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete}>
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export function MonitoringGroupAssignModal({
  isOpen,
  onClose,
  groups,
  sensors,
  sources,
}: {
  isOpen: boolean;
  onClose: () => void;
  groups?: MonitoringGroup[];
  sensors?: MonitoringSensor[];
  sources?: Source[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [autoComplete, setAutoComplete] = useState(false);
  const [isCreateGroupOpen, setCreateGrp] = useState(false);

  const [localGroups, setLocalGroups] = useState<MonitoringGroup[]>(groups ?? []);
  const [localSensors, setLocalSensors] = useState<MonitoringSensor[]>(sensors ?? []);
  const [localSources, setLocalSources] = useState<Source[]>(sources ?? []);
  
  useEffect(() => {
    let cancelled = false;

    const ensureData = async () => {
      try {
        if (!groups || groups.length === 0) {
          const fetchedGroups = await listMonitoringGroups();
          if (!cancelled) setLocalGroups(fetchedGroups);
        } else {
          setLocalGroups(groups);
        }

        if (!sensors || sensors.length === 0) {
          const fetchedSensors = await listSensors();
          if (!cancelled) setLocalSensors(fetchedSensors);
        } else {
          setLocalSensors(sensors);
        }

        if (!sources || sources.length === 0) {
          const fetchedSources = await listSources();
          if (!cancelled) setLocalSources(fetchedSources);
        } else {
          setLocalSources(sources);
        }
      } catch (err) {
        console.error("Failed to load missing data", err);
        toaster.create({
          type: "error",
          description: "Failed to load required data.",
        });
      }
    };

    ensureData();
    return () => {
      cancelled = true;
    };
  }, [groups, sensors, sources]);

  const options = useMemo(
    () => localGroups.map((g) => ({ id: g.id, label: g.group_name })),
    [localGroups]
  );

  const filtered = useMemo(
    () =>
      options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      ),
    [options, query]
  );

  const autocompleteFilter = useMemo(
    () => 
      filtered ? filtered.filter((f) => !selectedIds.has(f.label)) : options,
    [filtered, options, selectedIds]
  )

  const selectedGroupIds = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const sensorsInAllGroups = useMemo(() => {
    if (selectedGroupIds.length === 0) return [];

    return localSensors.filter((s) => {
      if (Array.isArray((s).sensor_group_id)) {
        // every selected group must be in the sensor's group_ids
        return selectedGroupIds.every((gid) => (s).sensor_group_id === gid);
      } else {
        // fallback: single group membership; only include when exactly one group is selected and it matches
        return selectedGroupIds.length === 1 && s.sensor_group_id === selectedGroupIds[0];
      }
    });
  }, [localSensors, selectedGroupIds]);

  // Locations of selected groups
  const selectedLocs = useMemo(() => {
    if (selectedGroupIds.length === 0) return [];
    const locs = localGroups
      .filter((g) => selectedIds.has(g.id))
      .map((g) => g.mon_loc_id);
    const unique = Array.from(new Set(locs));
    return unique.length === 1 ? unique : [];
  }, [localGroups, selectedIds, selectedGroupIds.length]);

  // Source IDs of selected locations
  const selectedSourceIds = useMemo(
    () => (localSources ?? [])
      .filter((src) => selectedLocs.includes(src.mon_loc_id))
      .map((src) => src.id),
    [localSources, selectedLocs]
  );
  
  const eligibleByLocation = useMemo(() => {
    if (selectedSourceIds.length === 0) return [];
    return localSensors.filter((s) => selectedSourceIds.includes(s.mon_source_id));
  }, [localSensors, selectedSourceIds]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };
  
  const [rightItems, setRightItems] = useState<MonitoringSensor[]>([]);
  const [middleItems, setMiddleItems] = useState<MonitoringSensor[]>([]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    let moved;
    if (source.droppableId === 'middle') {
      moved = middleItems[source.index];
      setMiddleItems(prev => prev.filter((_, i) => i !== source.index));
    } else {
      moved = rightItems[source.index];
      setRightItems(prev => prev.filter((_, i) => i !== source.index));
    }
    if (destination.droppableId === 'middle') {
      setMiddleItems(prev => {
        const copy = Array.from(prev);
        copy.splice(destination.index, 0, moved!);
        return copy;
      });
    } else {
      setRightItems(prev => {
        const copy = Array.from(prev);
        copy.splice(destination.index, 0, moved!);
        return copy;
      });
    }
  };

  useEffect(() => {
    setMiddleItems(() => {
      const assignedIds = new Set(sensorsInAllGroups.map((s) => s.id));
      return eligibleByLocation.filter((s) => !assignedIds.has(s.id));
    }
    );
    setRightItems(sensorsInAllGroups);
  }, [sensorsInAllGroups, eligibleByLocation]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()} size="cover">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header justifyContent="center">
              <Dialog.Title color="blue.600">Monitoring Groups</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Flex gap={4} justify="center" mx="auto" width="80%">
                  {/* Left: searchable table for selection */
                  <Box w="30%" p={2} bg="gray.100" border={"visible"} borderWidth={1} borderColor={"black"}>
                    {/* Left: searchable table for selection with tags inside search */}
                    <Box position="relative">
                    <Box border="1px solid" px={2} py={1} mb={2} maxW="100%" overflowX="auto" overflowY="visible" whiteSpace="nowrap" bg="white">
                      <Flex wrap="nowrap" align="center" gap={1}>
                        {[...selectedIds].map(id => {
                          const opt = options.find(o => o.id === id);
                          return opt ? (
                            <Box
                              key={id}
                              pl={2}
                              py={1}
                              borderWidth={1}
                              display="flex"
                              alignItems="center"
                              width="fit-content"
                            >
                              {opt.label}
                              <CloseButton size="2xs" p={0} m={0} onClick={() => toggle(id)} />
                            </Box>
                          ) : null;
                        })}
                        <Input
                          variant="flushed"
                          borderBottomWidth={0}
                          placeholder={selectedIds.size === 0 && !query ? "Search..." : ""}
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          flexGrow={1}
                          position="relative"
                          onFocus={() => setAutoComplete(true)}
                          onBlur={() => setAutoComplete(false)}
                        />
                      </Flex>
                    </Box>
                    <Table.Root size="sm" interactive position="absolute" top={"100%"} zIndex={2000} borderWidth={1} borderColor={"black"} left={0} pl={2} py={1} bg="white">
                      <Table.Body>
                      {query.length > 0 && autoComplete && autocompleteFilter.map(o => (
                        <Table.Row key={o.id} onClick={() => toggle(o.id)}>
                          <Table.Cell borderBottom={"black"}>
                            {o.label}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                      </Table.Body>
                    </Table.Root>
                    </Box>
                    <Table.Root size="sm" showColumnBorder interactive variant="outline" bg="white">
                      <Table.Header>
                        <Table.ColumnHeader textAlign={"center"} bg="white" color="blue.600" fontWeight={"bold"}>Sensor Groups</Table.ColumnHeader>
                      </Table.Header>
                      <Table.Body>
                        {filtered.map(o => (
                          <Table.Row
                            key={o.id}
                            cursor="pointer"
                            bg={selectedIds.has(o.id) ? "gray.100" : "undefined"}
                            onClick={() => toggle(o.id)}
                          >
                            <Table.Cell h="full">
                              <Flex>
                                <Checkbox.Root
                                  size="sm"
                                  checked={selectedIds.has(o.id)}
                                  colorPalette="blue"
                                  mr={"10px"}
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control cursor="pointer" _hover={{borderColor: "black"}} />
                                </Checkbox.Root>
                                {o.label}
                              </Flex>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                        <Table.Row>
                          <Table.Cell textAlign="center" color="blue.600" onClick={() => setCreateGrp(true)} cursor="pointer">
                            + New Group
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Root>
                  </Box>
                  /* Middle: Droppable */}
                  <Droppable droppableId="middle">
                    {provided => (
                      <Box
                        h="65vh"
                        overflowY="auto"
                        w="30%"
                        borderWidth={1}
                        p={2}
                        bg="gray.50"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <Box textAlign={"center"} border="1px solid gray" bg="white" p={2} color="red.600" fontWeight={"bold"}>Not Assigned</Box>
                        {middleItems.map((sensor, index) => (
                          <Draggable key={sensor.id} draggableId={sensor.id} index={index}>
                            {prov => (
                              <Box
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                p={2}
                                bg="white"
                                border="1px solid gray"
                              >
                                {sensor.sensor_name}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>

                  {/* Right: Droppable */}
                  <Droppable droppableId="right">
                    {provided => (
                      <Box
                        h="65vh"
                        overflowY="auto"
                        w="30%"
                        borderWidth={1}
                        p={2}
                        bg="gray.50"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <Text textAlign={"center"} border="1px solid gray" bg="white" p={2} color="green.600" fontWeight={"bold"}>Assigned</Text>
                        {rightItems.map((sensor, index) => (
                          <Draggable key={sensor.id} draggableId={sensor.id} index={index}>
                            {prov => (
                              <Box
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                p={2}
                                bg="white"
                                border="1px solid gray"
                              >
                                {sensor.sensor_name}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </Flex>
              </DragDropContext>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline">
                Apply
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
      <MonitoringGroupCreateModal isOpen={isCreateGroupOpen} onClose={() => setCreateGrp(false)} />
    </Dialog.Root>
  );
}