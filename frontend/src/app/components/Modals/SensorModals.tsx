// File: app/sensors/components/SensorModals.tsx
"use client";

// React + Next Imports
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Chakra Imports + Icons
import { Button, CloseButton, createListCollection, Dialog, Field, Flex, HStack, IconButton, Input, Portal, Select, Switch } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// Services + Types
import { listSources } from "@/services/sources";
import { createSensor, updateSensor, deleteSensor } from "@/services/sensors";
import type { Source } from "@/types/source";
import type { MonitoringSensor, MonitoringSensorPayload } from "@/types/sensor";
import type { MonitoringGroup } from "@/types/monitoringGroup";
import { listMonitoringGroups } from "@/services/monitoringGroups";
import { SourceCreateModal } from "./SourceModals";

interface BaseSensorModalProps {
  isOpen?: boolean;
  trigger: React.ReactElement;
  onClose?: () => void;
  onCreated?: (s: MonitoringSensor) => void;
  onEdited?: (s: MonitoringSensor) => void;
  onDeleted?: (id: string) => void;
  onDuplicated?: (s: MonitoringSensor) => void;
  projectId?: string;
  sensor?: MonitoringSensor;
}

// ==============================
// Shared Form Component
// ==============================
function SensorForm({
  onSubmit,
  initialData,
  initialProjectId,
  submitLabel,
}: {
  onSubmit: (payload: MonitoringSensorPayload) => Promise<void>;
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
  const isSourceLocked = Boolean(fixedSourceId && submitLabel == 'Create');
  const [groups, setGroups] = useState<MonitoringGroup[]>([]);

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
    if (!monSourceId) {
      setGroups([]);
      return;
    }
    const src = sources.find((s) => s.id === monSourceId);
    if (!src) return;
    // fetch monitoring groups for this source’s location
    listMonitoringGroups(src.mon_loc_id)
      .then(setGroups)
      .catch((err) => {
        console.error("Failed to load groups:", err);
        toaster.create({
          description: "Could not load sensor groups",
          type: "error",
        });
      });
    console.log(src.mon_loc_id);
  }, [monSourceId, sources]);

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
  const groupCollection = useMemo(
    () =>
      createListCollection({
        items: groups.map((g) => ({
          label: g.group_name,
          value: g.id,
        })),
      }),
    [groups]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log(monSourceId)
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
    <>
      <form id="sensor-form" onSubmit={handleSubmit}>
        <Dialog.Body>
          <HStack>
            <Field.Root required mb={4}>
              <Field.Label>Source</Field.Label>
              <Select.Root
                collection={sourceCollection}
                value={monSourceId ? [monSourceId] : []}
                onValueChange={(e) => setMonSourceId(e.value[0])}
                disabled={isSourceLocked}
                rounded="sm"
                _focusWithin={{
                  outline: "2px solid",
                  outlineColor: "var(--chakra-colors-blue-400)",
                  outlineOffset: "2px",
                }}
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
            <SourceCreateModal projectId={fixedProjectId}
              trigger={
                <IconButton mt="auto" mb={4} aria-label="New Source" outline="solid thin" variant="ghost">
                  <Plus size={16} />
                </IconButton>
              }
              onCreated={(created) => {
                setSources(prev => [created, ...prev]);
              }}
            />
          </HStack>
          <HStack>
            <Field.Root mb={4}>
              <Field.Label>Sensor Group</Field.Label>
              <Select.Root
                collection={groupCollection}
                value={sensorGroupId ? [sensorGroupId] : []}
                onValueChange={(e) => setSensorGroupId(e.value[0])}
                disabled={!monSourceId || !sources[0]}
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
                    <Select.ValueText placeholder={!monSourceId ? "Select a source first" : "[Optional] Select group"} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    {monSourceId && <Select.ClearTrigger />}
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {groupCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Field.Root>
            <IconButton mt="auto" mb={4} aria-label="New Project" outline="solid thin" variant="ghost">
              <Plus size={16} />
            </IconButton>
          </HStack>
          <Field.Root required mb={4}>
            <Field.Label>Sensor Name</Field.Label>
            <Input
              value={sensorName}
              borderColor={bc}
              onChange={(e) => setSensorName(e.target.value)}
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
            />
          </Field.Root>

          <Field.Root required mb={4}>
            <Field.Label>Sensor Type</Field.Label>
            <Input
              value={sensorType}
              borderColor={bc}
              onChange={(e) => setSensorType(e.target.value)}
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
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
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button colorScheme="gray" mr={3}>Cancel</Button>
          </Dialog.ActionTrigger>
          <Dialog.ActionTrigger asChild>
            <Button colorScheme="yellow" type="button" onClick={handleSubmit}>{submitLabel}</Button>
          </Dialog.ActionTrigger>
        </Dialog.Footer>
      </form>
      <Dialog.CloseTrigger asChild>
        <CloseButton size="sm" />
      </Dialog.CloseTrigger>
      {/*<SourceCreateModal isOpen={isCreateSourceOpen} onClose={() => { setCreateSourceOpen(false); } } />*/}
    </>
  );
}

// ==============================
// SensorCreateModal
// ==============================
export function SensorCreateModal({ trigger, onCreated, projectId }: BaseSensorModalProps) {
  const handleCreate = async (payload: MonitoringSensorPayload) => {
    try {
      const created = await createSensor(payload);
      toaster.create({ description: "Sensor created successfully", type: "success" });
      onCreated?.(created);
    } catch (err) {
      toaster.create({
        description: `Failed to create Sensor: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root size="md">
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop/>
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Create Sensor</Dialog.Title>
            </Dialog.Header>
            <SensorForm onSubmit={handleCreate} initialProjectId={projectId} submitLabel="Create" />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// SensorEditModal
// ==============================
export function SensorEditModal({ trigger, sensor, onEdited, projectId }: BaseSensorModalProps) {
 const handleUpdate = async (payload: MonitoringSensorPayload) => {
    if (!sensor) return;
  
    try {
      const edited = await updateSensor(sensor.id, payload);
      toaster.create({ description: "Sensor updated successfully", type: "success" });
      onEdited?.(edited);
    } catch (err) {
      toaster.create({
        description: `Failed to update Sensor: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root size="md">
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop/>
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Edit Sensor</Dialog.Title>
            </Dialog.Header>
            <SensorForm onSubmit={handleUpdate} initialData={sensor} initialProjectId={projectId} submitLabel="Save" />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// SensorDeleteModal
// ==============================
export function SensorDeleteModal({ trigger, sensor, onDeleted }: BaseSensorModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDelete = async () => {
    if (!sensor) return;
    try {
      await deleteSensor(sensor.id);
      toaster.create({ description: "Sensor deleted", type: "success" });
      const detailRoute = /^\/sensors\/[^\/]+$/;
      if (detailRoute.test(pathname)) {
        router.back();
      } else {
        onDeleted?.(sensor.id);
      }
    } catch (err) {
      toaster.create({
        description: `Failed to delete Sensor: ${err instanceof Error ? err.message : String(err)}`,
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
        <Dialog.Backdrop/>
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Delete Sensor</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm"/>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete <strong>{sensor?.sensor_name}</strong>?
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

export function SensorDuplicateModal({ trigger, sensor, onDuplicated }: BaseSensorModalProps) {
  const handleDuplicate = async (payload: MonitoringSensorPayload) => {
    const duplicated = await createSensor(payload);
    toaster.create({ description: 'Sensor created successfully', type: 'success' });
    onDuplicated?.(duplicated);
  };

  const cloneData: MonitoringSensor | undefined = sensor
    ? { ...sensor, sensor_name: '' }
    : undefined;

  return (
    <Dialog.Root size="md">
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop/>
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Duplicate Sensor</Dialog.Title>
            </Dialog.Header>
            <SensorForm
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