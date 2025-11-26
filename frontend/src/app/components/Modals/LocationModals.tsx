// File: app/locations/components/LocationModals.tsx
"use client";

// React + Next Imports
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
const MapPicker = dynamic(() => import("./components/MapPicker"), { ssr: false });

// Chakra Imports + Icons
import { Box, Button, CloseButton, createListCollection, Dialog, Field, Flex, HStack, IconButton, Input, Portal, Select, Switch } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";
import { X, Plus } from "lucide-react";

// Location Components
import { createLocation, updateLocation, deleteLocation } from "@/services/locations";
import type { Location, LocationPayload } from "@/types/location";

// Project Components
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/project";
//import { ProjectCreateModal } from "./ProjectModals";

interface BaseLocationModalProps {
  isOpen?: boolean;
  trigger: React.ReactElement;
  onClose?: () => void;
  onCreated?: (l: Location) => void;
  onEdited?: (l: Location) => void;
  onDeleted?: (id: string) => void;
  onDuplicated?: (l: Location) => void;
  projectId?: string;
  location?: Location;
}

const FREQUENCY_ITEMS = [
  { label: "Real Time", value: "real time"},
  { label: "Twice Daily", value: "twice daily"},
  { label: "Daily", value: "daily"},
  { label: "Twice Weekly", value: "twice weekly"},
  { label: "Weekly", value: "weekly"},
  { label: "Every Second Week", value: "every second week"},
  { label: "Monthly", value: "monthly"},
  { label: "Quarterly", value: "quarterly"},
]

import { Map } from "lucide-react";
import { ProjectCreateModal } from "./ProjectModals";

// ==============================
// Shared Form Component
// ==============================
function LocationForm({
  onSubmit,
  initialData,
  initialProjectId,
  submitLabel,
}: {
  onSubmit: (payload: LocationPayload) => Promise<void>;
  initialData?: Location;
  initialProjectId?: string;
  submitLabel: string;
}) {
  const { colorMode } = useColorMode();
  const bc = colorMode === "light" ? "black" : "white";
  const fixedProjectId = initialProjectId ?? initialData?.project_id;
  const isProjectLocked = Boolean(fixedProjectId && submitLabel == 'Create');
  const TORONTO: [number, number] = [43.6532, -79.3832];

  const [isMapOpen, setMapOpen] = useState(false);

  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(initialData?.project_id ?? initialProjectId ?? "");
  const [locName, setLocName] = useState(initialData?.loc_name ?? "");
  const [locNumber, setLocNumber] = useState(initialData?.loc_number ?? "");
  const [latitude, setLatitude] = useState(initialData ? initialData.lat : 0);
  const [longitude, setLongitude] = useState(initialData ? initialData.lon : 0);
  const [frequency, setFrequency] = useState(initialData?.frequency ?? "");
  const [active, setActive] = useState(initialData ? initialData.active : 1);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => {
        toaster.create({ description: "Failed to load projects", type: "error" });
      });
  }, []);

  useEffect(() => {
    if (initialData) {
      setProjectId(initialData.project_id);
      setLocName(initialData.loc_name);
      setLocNumber(initialData.loc_number ?? "");
      setLatitude(initialData.lat);
      setLongitude(initialData.lon);
      setFrequency(initialData.frequency);
      setActive(initialData.active);
    } else {
      setProjectId(initialProjectId ?? "");
      setLocName("");
      setLocNumber("");
      setLatitude(Number.NaN);
      setLongitude(Number.NaN);
      setFrequency("");
      setActive(1);
    }
  }, [initialData, initialProjectId]);

  const projectCollection = useMemo(() =>
    createListCollection({
      items: projects.map((p) => ({ label: p.project_name, value: p.id })),
    }),
    [projects]
  );

  const frequencyCollection = useMemo(
    () => createListCollection({ 
      items: FREQUENCY_ITEMS.map(opt => ({
        label: opt.label,
        value: opt.value
      }))}),
    []
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const latNum = latitude;
    const lonNum = longitude;
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      toaster.create({ description: "Invalid latitude or longitude", type: "error" });
      return;
    }
    const payload: LocationPayload = {
      project_id: projectId,
      loc_name: locName,
      loc_number: locNumber || undefined,
      lat: latNum,
      lon: lonNum,
      frequency,
      active,
    };
    await onSubmit(payload);
    router.refresh();
  };

  return (
    <>
      <form id="location-form" onSubmit={handleSubmit}>
        <Dialog.Body>
          <Field.Root required mb={4}>
            <Field.Label>Location Name</Field.Label>
            <Input value={locName} borderColor={bc} onChange={(e) => setLocName(e.target.value)}
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
            />
          </Field.Root>

          <Field.Root mb={4}>
            <Field.Label>Location Number</Field.Label>
            <Input value={locNumber} placeholder="Optional" borderColor={bc} onChange={(e) => setLocNumber(e.target.value)}
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
            />
          </Field.Root>

          <HStack>
            <Field.Root required mb={4}>
              <Field.Label>Project</Field.Label>
              <Select.Root
                collection={projectCollection}
                value={projectId ? [projectId] : []}
                onValueChange={(e) => setProjectId(e.value[0])}
                disabled={isProjectLocked}
                rounded="sm"
                _focusWithin={{
                  outline: "2px solid",
                  outlineColor: "var(--chakra-colors-blue-400)",
                  outlineOffset: "2px",
                }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger borderColor={bc}>
                    <Select.ValueText placeholder="Select project" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    {!isProjectLocked && <Select.ClearTrigger />}
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {projectCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Field.Root>

            <ProjectCreateModal
              trigger={
                <IconButton mt="auto" mb={4} aria-label="New Project" outline="solid thin" variant="ghost">
                  <Plus size={16} />
                </IconButton>
              }
              onCreated={(created) => {
                setProjects(prev => [created, ...prev]);
              }}
            />
          </HStack>

          <HStack gap={4} mb={4}>
            <Field.Root required>
              <Field.Label>Latitude</Field.Label>
              <Input
                type="number"
                step="0.000001"
                value={Number.isFinite(latitude) ? latitude : ""} // show empty if NaN
                borderColor={bc}
                onChange={(e) => {
                  const val = e.target.value;
                  setLatitude(val === "" ? Number.NaN : parseFloat(val));
                }}
                _focusWithin={{
                  outline: "2px solid",
                  outlineColor: "var(--chakra-colors-blue-400)",
                  outlineOffset: "2px",
                }}
              />
            </Field.Root>

            <Field.Root required>
              <Field.Label>Longitude</Field.Label>
              <Input
                type="number"
                step="0.000001"
                value={Number.isFinite(longitude) ? longitude : ""}
                borderColor={bc}
                onChange={(e) => {
                  const val = e.target.value;
                  setLongitude(val === "" ? Number.NaN : parseFloat(val));
                }}
                _focusWithin={{
                  outline: "2px solid",
                  outlineColor: "var(--chakra-colors-blue-400)",
                  outlineOffset: "2px",
                }}
              />
            </Field.Root>

            <Box marginTop={"auto"}>
              <IconButton
                aria-label="coordinates-map"
                variant="outline"
                borderColor={"black"}
                _dark={{borderColor: "white"}}
                onClick={(e) => {
                  e.preventDefault();
                  setMapOpen(true);
                }}
              >
                <Map/>
              </IconButton>
            </Box>
          </HStack>

          {/* Map dialog (MapLibre) */}
          <Dialog.Root open={isMapOpen} onOpenChange={(o) => !o && setMapOpen(false)} size="xl">
            <Portal>
              <Dialog.Backdrop zIndex={2004}/>
              <Dialog.Positioner zIndex={2005}>
                <Dialog.Content border="2px solid" maxW="90vw" w="900px" zIndex={2006}>
                  <Dialog.Header>
                    <Dialog.Title>Select Location</Dialog.Title>
                    <Dialog.CloseTrigger asChild>
                      <IconButton aria-label="Close" variant="ghost" onClick={() => setMapOpen(false)}>
                        <X size={16} />
                      </IconButton>
                    </Dialog.CloseTrigger>
                  </Dialog.Header>
                  <Dialog.Body>
                    <MapPicker
                      lat={Number.isFinite(latitude) && !(latitude === 0 && longitude === 0) ? latitude : null}
                      lon={Number.isFinite(longitude) && !(latitude === 0 && longitude === 0) ? longitude : null}
                      defaultCenter={TORONTO}
                      onPick={(la, lo) => {
                        setLatitude(+la.toFixed(6));
                        setLongitude(+lo.toFixed(6));
                      }}
                      height={400}
                    />
                    <Flex mt={3} gap={3} align="center" justify="flex-end">
                      <Button
                        onClick={() => {
                          setLatitude(TORONTO[0]);
                          setLongitude(TORONTO[1]);
                        }}
                        variant="surface"
                      >
                        Center on Toronto
                      </Button>
                      <Button onClick={() => setMapOpen(false)}>Done</Button>
                    </Flex>
                  </Dialog.Body>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>

          <Field.Root required mb={4}>
            <Field.Label>Frequency</Field.Label>
            <Select.Root
              collection={frequencyCollection}
              value={frequency ? [frequency] : []}
              onValueChange={(e) => setFrequency(e.value[0])}
              rounded="sm"
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger borderColor={bc}>
                  <Select.ValueText placeholder="Select frequency" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {frequencyCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>

          <Field.Root justifyItems={"center"}>
            <Flex gap="2">
            <Field.Label>Active</Field.Label>
            <Switch.Root
              checked={active === 1}
              onCheckedChange={({ checked }) => setActive(checked? 1 : 0)}
            >
              <Switch.HiddenInput />
              <Switch.Control _checked={{ bg: 'green.400' }}>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
            </Flex>
          </Field.Root>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button colorScheme="gray" mr={3}>Cancel</Button>
          </Dialog.ActionTrigger>
          <Dialog.ActionTrigger asChild>
            <Button colorScheme="yellow" type="submit">{submitLabel}</Button>
          </Dialog.ActionTrigger>
        </Dialog.Footer>
      </form>
      <Dialog.CloseTrigger asChild>
        <CloseButton size="sm" />
      </Dialog.CloseTrigger>
      {/*<ProjectCreateModal isOpen={isCreateOpen} onClose={() => { setCreateOpen(false);}} />*/}
    </>
  );
}

// ==============================
// LocationCreateModal
// ==============================
export function LocationCreateModal({ trigger, onCreated, projectId }: BaseLocationModalProps) {
  const handleCreate = async (payload: LocationPayload) => {
    try {
      const created = await createLocation(payload);
      toaster.create({ description: "Location created", type: "success" });
      onCreated?.(created);
    } catch (err) {
      toaster.create({
        description: `Failed to create Location: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root key="createloc" size="lg">
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop zIndex={2000}/>
        <Dialog.Positioner zIndex={2001}>
          <Dialog.Content border="2px solid" zIndex={2002}>
            <Dialog.Header>
              <Dialog.Title>Create Location</Dialog.Title>
            </Dialog.Header>
            <LocationForm onSubmit={handleCreate} submitLabel="Create" initialProjectId={projectId} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// LocationEditModal
// ==============================
export function LocationEditModal({ trigger, location, onEdited }:  BaseLocationModalProps) {
  const handleUpdate = async (payload: LocationPayload) => {
    if (!location) return;

    const changedPayload: LocationPayload = {};
    if (payload.project_id !== location.project_id) changedPayload.project_id = payload.project_id;
    if (payload.loc_name !== location.loc_name) changedPayload.loc_name = payload.loc_name;
    if (payload.loc_number !== location.loc_number) changedPayload.loc_number = payload.loc_number;
    if (payload.lat !== location.lat) changedPayload.lat = payload.lat;
    if (payload.lon !== location.lon) changedPayload.lon = payload.lon;
    if (payload.frequency !== location.frequency) changedPayload.frequency = payload.frequency;
    if (payload.active !== location.active) changedPayload.active = payload.active;

    if (Object.keys(changedPayload).length === 0) {
      toaster.create({ description: "No changes detected.", type: "info" });
      return;
    }

    try {
      const edited = await updateLocation(location.id, changedPayload);
      toaster.create({ description: "Location updated", type: "success" });
      onEdited?.(edited);
    } catch (err) {
      toaster.create({
        description: `Failed to update Location: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root key="editloc" size="lg">
      <Portal>
        <Dialog.Backdrop zIndex={2000}/>
        <Dialog.Positioner zIndex={2001}>
          <Dialog.Content border="2px solid" zIndex={2002}>
            <Dialog.Header>
              <Dialog.Title>Edit Location</Dialog.Title>
            </Dialog.Header>
            <LocationForm onSubmit={handleUpdate} initialData={location} submitLabel="Save" />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
    </Dialog.Root>
  );
}

// ==============================
// LocationDeleteModal
// ==============================
export function LocationDeleteModal({ trigger, location, onDeleted }: BaseLocationModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDelete = async () => {
    if (!location) return;
    try {
      await deleteLocation(location.id);
      toaster.create({ description: "Location deleted", type: "success" });
      const detailRoute = /^\/projects\/[^\/]+\/locations\/[^\/]+$/;
      if (detailRoute.test(pathname)) {
        router.back();
      } else {
        onDeleted?.(location.id);
      }
    } catch (err) {
      toaster.create({
        description: `Failed to delete Location: ${(err as Error).message}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root size="sm">
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop zIndex={2000}/>
        <Dialog.Positioner zIndex={2001}>
          <Dialog.Content border="2px solid" zIndex={2002}>
            <Dialog.Header>
              <Dialog.Title>Delete Location</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm"/>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete <strong>{location?.loc_name}</strong>?
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button colorScheme="gray">Cancel</Button>
              </Dialog.ActionTrigger>
              <Dialog.ActionTrigger asChild>
                <Button onClick={handleDelete}>Delete</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export function LocationDuplicateModal({ trigger, location, onDuplicated }: BaseLocationModalProps) {
  const handleDuplicate = async (payload: LocationPayload) => {
    const duplicated = await createLocation(payload);
    toaster.create({ description: 'Location created successfully', type: 'success' });
    onDuplicated?.(duplicated);
  };

  const cloneData: Location | undefined = location
    ? { ...location, loc_name: '', loc_number: '' }
    : undefined;

  return (
    <Dialog.Root size="lg">
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop zIndex={2000}/>
        <Dialog.Positioner zIndex={2001}>
          <Dialog.Content border="2px solid" zIndex={2002}>
            <Dialog.Header>
              <Dialog.Title>Duplicate Location</Dialog.Title>
            </Dialog.Header>
            <LocationForm
              onSubmit={handleDuplicate}
              initialData={cloneData}
              submitLabel="Duplicate"
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}