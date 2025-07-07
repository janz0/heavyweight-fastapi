// File: app/sensors/components/SensorModals.tsx
"use client";

// React + Next Imports
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Chakra Imports + Icons
import { Button, CloseButton, createListCollection, Dialog, Field, Flex, IconButton, Input, Portal, Select, Switch } from "@chakra-ui/react";
import { X } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// Services + Types
import { listSources } from "@/services/sources";
import { createSensor, updateSensor, deleteSensor } from "@/services/sensors";
import type { Source } from "@/types/source";
import type { MonitoringSensor, MonitoringSensorPayload } from "@/types/sensor";

// ==============================
// Shared Form Component
// ==============================
function SensorForm({
  onSubmit,
  onClose,
  initialData,
  initialProjectId,
  submitLabel,
}: {
  onSubmit: (payload: MonitoringSensorPayload) => Promise<void>;
  onClose: () => void;
  initialData?: MonitoringSensor;
  initialProjectId?: string;
  submitLabel: string;
}) {
  const { colorMode } = useColorMode();
  const bc = colorMode === "light" ? "black" : "white";

  const fixedProjectId = initialProjectId;

  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [monSourceId, setMonSourceId] = useState(initialData?.mon_source_id ?? "");
  const [sensorGroupId, setSensorGroupId] = useState(initialData?.sensor_group_id ?? "");
  const [sensorName, setSensorName] = useState(initialData?.sensor_name ?? "");
  const [sensorType, setSensorType] = useState(initialData?.sensor_type ?? "");
  const [active, setActive] = useState(initialData ? initialData.active === 1 : true);
  const fixedSourceId = initialData?.mon_source_id;
  const isSourceLocked = Boolean(fixedSourceId);

  useEffect(() => {
    if (fixedProjectId)
      listSources(fixedProjectId)
        .then(setSources)
        .catch((err) => {
          console.error("Failed to load sources:", err);
          toaster.create({ description: "Could not load sources", type: "error" });
        });
    else 
      listSources()
        .then(setSources)
        .catch((err) => {
          console.error("Failed to load sources:", err);
          toaster.create({ description: "Could not load sources", type: "error" });
        });
  }, [fixedProjectId]);

  useEffect(() => {
    if (initialData) {
      setMonSourceId(initialData.mon_source_id);
      setSensorGroupId(initialData.sensor_group_id || '');
      setSensorName(initialData.sensor_name);
      setSensorType(initialData.sensor_type);
      setActive(initialData.active === 1);
    } else {
      setMonSourceId('');
      setSensorGroupId('');
      setSensorName('');
      setSensorType('');
      setActive(true);
    }
  }, [initialData]);

  const sourceCollection = useMemo(
    () => createListCollection({
      items: sources.map((s) => ({ label: s.source_name, value: s.id })),
    }),
    [sources]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: MonitoringSensorPayload = {
      mon_source_id: monSourceId,
      sensor_name: sensorName,
      sensor_type: sensorType,
      active: active ? 1 : 0,
    };
    if (sensorGroupId) payload.sensor_group_id = sensorGroupId;
    console.log(payload);
    await onSubmit(payload);
    router.refresh();
  };

  return (
    <form id="sensor-form" onSubmit={handleSubmit}>
      <Field.Root required mb={4}>
        <Field.Label>Source</Field.Label>
        <Select.Root
          collection={sourceCollection}
          value={monSourceId ? [monSourceId] : []}
          onValueChange={(e) => setMonSourceId(e.value[0])}
          disabled={isSourceLocked}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger borderColor={bc} >
              <Select.ValueText placeholder="Select source" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              {!isSourceLocked && <Select.ClearTrigger />}
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {sourceCollection.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label>Sensor Group ID</Field.Label>
        <Input
          placeholder="Optional UUID"
          value={sensorGroupId}
          borderColor={bc}
          onChange={(e) => setSensorGroupId(e.target.value)}
        />
      </Field.Root>

      <Field.Root required mb={4}>
        <Field.Label>Sensor Name</Field.Label>
        <Input
          value={sensorName}
          borderColor={bc}
          onChange={(e) => setSensorName(e.target.value)}
        />
      </Field.Root>

      <Field.Root required mb={4}>
        <Field.Label>Sensor Type</Field.Label>
        <Input
          value={sensorType}
          borderColor={bc}
          onChange={(e) => setSensorType(e.target.value)}
        />
      </Field.Root>

      <Field.Root justifyItems={"center"}>
        <Flex gap="2">
        <Field.Label>Active</Field.Label>
        <Switch.Root
          checked={active}
          onCheckedChange={({ checked }) => setActive(checked)}
        >
          <Switch.HiddenInput />
          <Switch.Control _checked={{ bg: 'green.400' }}>
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
// SensorCreateModal
// ==============================
export function SensorCreateModal({ isOpen, onClose, projectId }: { isOpen: boolean; onClose: () => void; projectId?: string;}) {
  const handleCreate = async (payload: MonitoringSensorPayload) => {
    try {
      await createSensor(payload);
      toaster.create({ description: "Sensor created successfully", type: "success" });
      onClose();
    } catch (err) {
      toaster.create({
        description: `Create failed: ${(err as Error).message}`,
        type: "error",
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
              <Dialog.Title>Create Sensor</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <SensorForm onSubmit={handleCreate} initialProjectId={projectId} onClose={onClose} submitLabel="Create" />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// SensorEditModal
// ==============================
export function SensorEditModal({ isOpen, onClose, sensor }: { isOpen: boolean; onClose: () => void; sensor?: MonitoringSensor; }) {
 const handleUpdate = async (payload: MonitoringSensorPayload) => {
    if (!sensor) return;
    
    // Compare each field with initial sensor data
    const changedPayload: MonitoringSensorPayload = {};

    if (payload.mon_source_id !== sensor.mon_source_id) {
      changedPayload.mon_source_id = payload.mon_source_id;
    }
    if ((payload.sensor_group_id || undefined) !== sensor.sensor_group_id) {
      changedPayload.sensor_group_id = payload.sensor_group_id;
    }
    if (payload.sensor_name !== sensor.sensor_name) {
      changedPayload.sensor_name = payload.sensor_name;
    }
    if (payload.sensor_type !== sensor.sensor_type) {
      changedPayload.sensor_type = payload.sensor_type;
    }
    if (payload.active !== sensor.active) {
      changedPayload.active = payload.active;
    }

    if (Object.keys(changedPayload).length === 0) {
      toaster.create({
        description: "No changes detected.",
        type: "info",
      });
      return;
    }

    try {
      await updateSensor(sensor.id, changedPayload);
      toaster.create({ description: "Sensor updated successfully", type: "success" });
      onClose();
    } catch (err) {
      toaster.create({
        description: `Update failed: ${(err as Error).message}`,
        type: "error",
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
              <Dialog.Title>Edit Sensor</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <SensorForm onSubmit={handleUpdate} onClose={onClose} initialData={sensor} submitLabel="Save" />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// SensorDeleteModal
// ==============================
export function SensorDeleteModal({ isOpen, onClose, sensor }: { isOpen: boolean; onClose: () => void; sensor?: MonitoringSensor; }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDelete = async () => {
    if (!sensor) return;
    try {
      await deleteSensor(sensor.id);
      toaster.create({ description: "Sensor deleted successfully", type: "success" });
      onClose();

      // Refresh or go back depending on route
      const detailRoute = /^\/sensors\/[^\/]+$/;
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
              <Dialog.Title>Delete Sensor</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete <strong>{sensor?.sensor_name}</strong>?
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