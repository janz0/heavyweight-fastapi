// File: app/locations/components/MonitoringGroupModals.tsx
'use client';

import React, { FormEvent, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SearchInput from "../UI/SearchInput";
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
  Icon,
  HStack,
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
import { Plus } from "phosphor-react";
import { updateSensor } from "@/services/sensors";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

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
        <Dialog.Positioner >
          <Dialog.Content border="2px solid" >
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isCreateGroupOpen, setCreateGrp] = useState(false);

  const [localGroups, setLocalGroups] = useState<MonitoringGroup[]>(groups ?? []);
  const [localSensors, setLocalSensors] = useState<MonitoringSensor[]>(sensors ?? []);
  const [localSources, setLocalSources] = useState<Source[]>(sources ?? []);

  const router = useRouter();

const handleApply = async () => {
    if (!selectedId) {
      toaster.create({ type: "warning", description: "Select a group first." });
      return;
    }

    try {
      // what was assigned to this group when modal opened / last compute
      const before = new Set(sensorsInAllGroups.map((s) => s.id));
      // what user wants assigned now (the right column)
      const after = new Set(rightItems.map((s) => s.id));

      const toAdd = rightItems.filter((s) => !before.has(s.id));
      const toRemove = sensorsInAllGroups.filter((s) => !after.has(s.id));

      await Promise.all([
        // assign selected group
        ...toAdd.map((s) =>
          updateSensor(s.id, { sensor_group_id: selectedId })
        ),
        // unassign from this group
        ...toRemove.map((s) =>
          updateSensor(s.id, { sensor_group_id: null })
        ),
      ]);

      toaster.create({ type: "success", description: "Sensor Group Updated" });
      router.refresh();
    } catch (e) {
      console.error(e);
      toaster.create({
        type: "error",
        description: "Failed to update sensor assignments.",
      });
    }
  };

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

  const filtered = useMemo(() => {
    // Apply search filter first
    const base = options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );

    // If no search query, sort with selected group(s) on top
    /*if (!query) {
      base = base.sort((a, b) => {
        const aSelected = a.id === selectedId;
        const bSelected = b.id === selectedId;
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.label.localeCompare(b.label);
      });
    }*/

    return base;
  }, [options, query]);


  const sensorsInAllGroups = useMemo(() => {
    if (!selectedId) return [];
    return localSensors.filter(s => {
      const gid = s.sensor_group_id as unknown;
      return Array.isArray(gid) ? gid.includes(selectedId) : gid === selectedId;
    });
  }, [localSensors, selectedId]);

  const selectedLocs = useMemo(() => {
    if (!selectedId) return [];
    const g = localGroups.find(grp => grp.id === selectedId);
    return g ? [g.mon_loc_id] : [];
  }, [localGroups, selectedId]);

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

  const selectGroup = (id: string) => setSelectedId(id);
  
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
  const moveMiddleToRight = (sensor: MonitoringSensor) => {
    setMiddleItems(prev => prev.filter(s => s.id !== sensor.id));
    setRightItems(prev => (prev.some(s => s.id === sensor.id) ? prev : [...prev, sensor]));
  };

  const moveRightToMiddle = (sensor: MonitoringSensor) => {
    setRightItems(prev => prev.filter(s => s.id !== sensor.id));
    setMiddleItems(prev => (prev.some(s => s.id === sensor.id) ? prev : [...prev, sensor]));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()} size="cover">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner background={"blackAlpha.300"} _dark={{bg: "whiteAlpha.300"}}>
          <Dialog.Content bg={"bg.muted"} w={{base: "100%", md: "70%"}} h="100%" borderRadius={"md"}>
            <Dialog.Header justifyContent="center">
              <Dialog.Title color="blue.500" p={{base: 1, md: 4}}>Monitoring Groups</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body pb={2}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Flex gap={{base: 2, md: 4}} direction={{base: "column", md: "row"}} justify="center" mx="auto" >
                  {/* Left: searchable table for selection */
                  <Box position="relative" w={{base: "100%", md: "30%"}} h={{base:"30vh", md: "70vh"}} p={2} bg="gray.100" borderRadius={"md"} border={"visible"} borderWidth={2} borderColor={"black"} _dark={{ bg: "gray.800", borderColor: "white" }}>
                    {/* Left: searchable table for selection with tags inside search */}
                    <Box position="relative">
                      <Flex wrap="nowrap" align="center" pb={2} overflow="hidden">
                        <SearchInput value={query} onChange={setQuery} placeholder={`Search Groups...`}/>
                      </Flex>
                    </Box>
                    <Box maxH="18vh" overflowY="auto">
                      <Table.Root size="sm" showColumnBorder interactive variant="outline" bg="white" _dark={{ bg: "black" }} >
                        <Table.Body>
                          {filtered.map(o => (
                            <Table.Row
                              key={o.id}
                              cursor="pointer"
                              bg={selectedId === o.id ? "gray.50" : undefined}
                              _dark={{bg: selectedId === o.id ? "gray.900" : undefined}}
                              onClick={() => {if (selectedId != o.id) selectGroup(o.id); else selectGroup('');}}
                            >
                              <Table.Cell h="full">
                                <Flex>
                                  <Checkbox.Root
                                    size="sm"
                                    checked={selectedId === o.id}
                                    colorPalette="blue"
                                    mr={"10px"}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control cursor="pointer" _hover={{borderColor: "black"}} _dark={{ _hover: {borderColor: "white"}}} />
                                  </Checkbox.Root>
                                  {o.label}
                                </Flex>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                    <Box justifySelf={"right"} py={2} pt={3}>
                      <Button onClick={() => setCreateGrp(true)} borderRadius="md" boxShadow="sm" color="black" bg="orange" size={{base: "xs", md:"sm"}}>
                        <Plus/><Text display={{base: "none", md: "block"}}>Add New</Text>
                      </Button>
                    </Box>
                  </Box>
                  /* Middle: Droppable */}
                  <Droppable droppableId="middle">
                    {provided => (
                      <Box
                        h={{base:"20vh", md: "70vh"}}
                        w={{base: "100%", md: "30%"}}
                        borderWidth={2}
                        borderRadius={"md"}
                        p={2}
                        bg="gray.100" border={"visible"} borderColor={"black"} _dark={{ bg: "gray.800", borderColor: "white" }}
                      >
                        <Box
                          maxH="100%"
                          overflowY="auto"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          <Box textAlign={"center"} border="1px solid gray" bg="white" _dark={{ bg: "black" }} p={2} fontWeight={"bold"} borderRadius={"md"} mb={2}>Not Assigned</Box>
                          {middleItems.map((sensor, index) => (
                            <Draggable key={sensor.id} draggableId={sensor.id} index={index}>
                              {prov => (
                                <HStack
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  p={2}
                                  mb={0.5}
                                  bg="white"
                                  _dark={{bg: "black"}}
                                  border="1px solid gray"
                                  alignItems={"center"}
                                >
                                  {sensor.sensor_name}
                                  <Icon as={LuChevronRight} ml="auto" cursor={"pointer"} size="sm" borderRadius="md" _hover={{bg: "gray.300"}} _dark={{_hover: {bg: "gray.700"}}} onClick={(e) => { e.stopPropagation(); moveMiddleToRight(sensor); }}/>
                                </HStack>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      </Box>
                    )}
                  </Droppable>

                  {/* Right: Droppable */}
                  <Droppable droppableId="right">
                    {provided => (
                      <Box
                        h={{base:"20vh", md: "70vh"}}
                        w={{base: "100%", md: "30%"}}
                        borderWidth={2}
                        borderRadius={"md"}
                        p={2}
                        bg="gray.100" border={"visible"} borderColor={"black"} _dark={{ bg: "gray.800", borderColor: "white" }}
                      >
                        <Box
                          maxH="100%"
                          overflowY="auto"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          <Text textAlign={"center"} border="1px solid gray" bg="white" _dark={{ bg: "black" }} p={2} fontWeight={"bold"} borderRadius={"md"} mb={2}>Assigned</Text>
                          {rightItems.map((sensor, index) => (
                            <Draggable key={sensor.id} draggableId={sensor.id} index={index}>
                              {prov => (
                                <HStack
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  p={2}
                                  bg="white"
                                  _dark={{bg: "black"}}
                                  border="1px solid gray"
                                  alignItems={"center"}
                                >
                                  <Icon as={LuChevronLeft} mr="auto" cursor={"pointer"} size="sm" borderRadius="md" _hover={{bg: "gray.300"}} _dark={{_hover: {bg: "gray.700"}}} onClick={(e) => { e.stopPropagation(); moveRightToMiddle(sensor); }}/>
                                  {sensor.sensor_name}
                                </HStack>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      </Box>
                    )}
                  </Droppable>
                </Flex>
              </DragDropContext>
            </Dialog.Body>

            <Dialog.Footer pt={0}>
              <Button variant="outline" onClick={handleApply}>
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