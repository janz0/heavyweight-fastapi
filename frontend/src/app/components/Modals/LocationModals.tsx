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
import { ProjectCreateModal } from "./ProjectModals";

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

// ==============================
// Shared Form Component
// ==============================
function LocationForm({
  onSubmit,
  onClose,
  initialData,
  initialProjectId,
  submitLabel,
}: {
  onSubmit: (payload: LocationPayload) => Promise<void>;
  onClose: () => void;
  initialData?: Location;
  initialProjectId?: string;
  submitLabel: string;
}) {
  const { colorMode } = useColorMode();
  const bc = colorMode === "light" ? "black" : "white";
  const fixedProjectId = initialProjectId ?? initialData?.project_id;
  const isProjectLocked = Boolean(fixedProjectId);
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

  const [isCreateOpen, setCreateOpen] = useState(false);
  const handleNewProject = () => { setCreateOpen(true); };

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
    <form id="location-form" onSubmit={handleSubmit}>
      <Field.Root required mb={4}>
        <Field.Label>Location Name</Field.Label>
        <Input value={locName} borderColor={bc} onChange={(e) => setLocName(e.target.value)} />
      </Field.Root>
      <Field.Root mb={4}>
        <Field.Label>Location Number</Field.Label>
        <Input value={locNumber} placeholder="Optional" borderColor={bc} onChange={(e) => setLocNumber(e.target.value)} />
      </Field.Root>
      <HStack>
        <Field.Root required mb={4}>
          <Field.Label>Project</Field.Label>
          <Select.Root
            collection={projectCollection}
            value={projectId ? [projectId] : []}
            onValueChange={(e) => setProjectId(e.value[0])}
            disabled={isProjectLocked}
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
        <IconButton mt="auto" mb={4} aria-label="New Project" outline="solid thin" variant="ghost" onClick={handleNewProject}>
          <Plus size={16} />
        </IconButton>
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
          />
        </Field.Root>
        <Box marginTop={"auto"}>
          <IconButton
            aria-label="coordinates-map"
            variant="outline"
            borderColor={"black"}
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
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content border="2px solid" maxW="90vw" w="900px">
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
      <Dialog.Footer>
        <Button colorScheme="gray" mr={3} type="button" onClick={onClose}>Cancel</Button>
        <Button colorScheme="yellow" type="submit">{submitLabel}</Button>
      </Dialog.Footer>
      <ProjectCreateModal isOpen={isCreateOpen} onClose={() => { setCreateOpen(false);}} />
    </form>
  );
}

// ==============================
// LocationCreateModal
// ==============================
export function LocationCreateModal({
  isOpen,
  onClose,
  projectId,
}: { isOpen: boolean; onClose: () => void; projectId?: string }) {
  const handleCreate = async (payload: LocationPayload) => {
    try {
      await createLocation(payload);
      toaster.create({ description: "Location created successfully", type: "success" });
      onClose();
    } catch (err) {
      toaster.create({
        description: `Create failed: ${(err as Error).message}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid" zIndex={1200}>
            <Dialog.Header>
              <Dialog.Title>Create Location</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <LocationForm onSubmit={handleCreate} onClose={onClose} submitLabel="Create" initialProjectId={projectId} />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// LocationEditModal
// ==============================
export function LocationEditModal({
  isOpen,
  onClose,
  location,
}: { isOpen: boolean; onClose: () => void; location?: Location }) {
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
      await updateLocation(location.id, changedPayload);
      toaster.create({ description: "Location updated successfully", type: "success" });
      onClose();
    } catch (err) {
      toaster.create({
        description: `Update failed: ${(err as Error).message}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Edit Location</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <LocationForm onSubmit={handleUpdate} onClose={onClose} initialData={location} submitLabel="Save" />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// LocationDeleteModal
// ==============================
export function LocationDeleteModal({
  isOpen,
  onClose,
  location,
}: { isOpen: boolean; onClose: () => void; location?: Location }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDelete = async () => {
    if (!location) return;
    try {
      await deleteLocation(location.id);
      toaster.create({ description: "Location deleted successfully", type: "success" });
      onClose();
      const detailRoute = /^\/projects\/[^\/]+\/locations\/[^\/]+$/;
      if (detailRoute.test(pathname)) {
        router.back();
      } else {
        router.refresh();
      }
    } catch (err) {
      toaster.create({
        description: `Delete failed: ${(err as Error).message}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="sm">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Delete Location</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete <strong>{location?.loc_name}</strong>?
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorScheme="gray" onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete}>Delete</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
