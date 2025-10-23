// File: app/locations/components/LocationModals.tsx
"use client";

// React + Next Imports
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Chakra Imports + Icons
import { Button, CloseButton, createListCollection, Dialog, Field, Flex, HStack, IconButton, Input, Portal, Select, Switch } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";
import { X } from "lucide-react";

// Location Components
import { createLocation, updateLocation, deleteLocation } from "@/services/locations";
import type { Location, LocationPayload } from "@/types/location";

// Project Components
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/project";

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

  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(initialData?.project_id ?? initialProjectId ?? "");
  const [locName, setLocName] = useState(initialData?.loc_name ?? "");
  const [locNumber, setLocNumber] = useState(initialData?.loc_number ?? "");
  const [latitude, setLatitude] = useState(initialData ? String(initialData.lat) : "");
  const [longitude, setLongitude] = useState(initialData ? String(initialData.lon) : "");
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
      setLatitude(String(initialData.lat));
      setLongitude(String(initialData.lon));
      setFrequency(initialData.frequency);
      setActive(initialData.active);
    } else {
      setProjectId(initialProjectId ?? "");
      setLocName("");
      setLocNumber("");
      setLatitude("");
      setLongitude("");
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
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
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
      <HStack gap={4} mb={4}>
        <Field.Root required>
          <Field.Label>Latitude</Field.Label>
          <Input type="number" value={latitude} borderColor={bc} onChange={(e) => setLatitude(e.target.value)} />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Longitude</Field.Label>
          <Input type="number" value={longitude} borderColor={bc} onChange={(e) => setLongitude(e.target.value)} />
        </Field.Root>
      </HStack>
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
          <Dialog.Content border="2px solid">
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
