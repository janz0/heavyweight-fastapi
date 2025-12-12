// File: app/sensors/components/SensorModals.tsx
"use client";

// React + Next Imports
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Chakra Imports + Icons
import { Button, CloseButton, createListCollection, Dialog, Field, Flex, HStack, IconButton, Input, Portal, Select, Switch } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { toaster } from "@/components/ui/toaster";

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
  locationId?: string;
  sourceId?: string;
  sensor?: MonitoringSensor;
}

// ==============================
// Shared Form Component
// ==============================
function SensorForm({
  onSubmit,
  initialData,
  initialProjectId,
  initialLocationId,
  initialSourceId,
  submitLabel,
}: {
  onSubmit: (payload: MonitoringSensorPayload) => Promise<void>;
  initialData?: MonitoringSensor;
  initialProjectId?: string;
  initialLocationId?: string;
  initialSourceId?: string;
  submitLabel: string;
}) {
  const fixedProjectId = initialProjectId;
  const fixedLocationId = initialLocationId;
  const fixedSourceId = initialSourceId ?? initialData?.mon_source_id;
  const isSourceLocked = Boolean(fixedSourceId && submitLabel == 'Create');

  const router = useRouter();
  
  const [sources, setSources] = useState<Source[]>([]);
  const [sensorName, setSensorName] = useState(initialData?.sensor_name ?? "");
  const [sensorType, setSensorType] = useState(initialData?.sensor_type ?? "");
  const [active, setActive] = useState(initialData ? initialData.active === 1 : true);

  const [sourceId, setSourceId] = useState<string>(fixedSourceId ?? "");
  const [groupIds, setGroupIds] = useState<string[]>(
    initialData?.sensor_group_id ? [initialData.sensor_group_id] : []
  );
  const [groups, setGroups] = useState<MonitoringGroup[]>([]);

  const [errors, setErrors] = useState<{
    srcId?: string;
    senName?: string;
    senType?: string;
  }>({});

  // This needs updating for if location is provided, if inside location then the location should be specified instead of the project id
  useEffect(() => {
    listSources(fixedProjectId, fixedLocationId)
    .then(setSources)
      .catch((err) => {
        console.error("Failed to load sources:", err);
        toaster.create({ description: "Could not load sources", type: "error" });
      });
  }, [fixedProjectId, fixedLocationId]);

  useEffect(() => {
    if (!fixedSourceId) {
      setGroups([]);
      return;
    }
    const src = sources.find((s) => s.id === fixedSourceId);
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
  }, [sources]);

  useEffect(() => {
    if (!initialData) return;
    setSourceId(initialData.mon_source_id);
    setGroupIds(initialData.sensor_group_id ? [initialData.sensor_group_id] : []);
    setSensorName(initialData.sensor_name);
    setSensorType(initialData.sensor_type);
    setActive(initialData.active === 1);
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

    const nextErrors: typeof errors = {};
    let hasError = false;

    if (!sourceId.trim()){
      nextErrors.srcId = "Source is required";
      hasError = true;
    }

    if (!sensorName.trim()) {
      nextErrors.senName = "Sensor name is required";
      hasError = true;
    }

    if (!sensorType.trim()) {
      nextErrors.senType = "Sensor type is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(nextErrors);
      toaster.create({
        description: "Please fix the highlighted fields.",
        type: "error",
      });
      return;
    }

    setErrors({});

    const payload: MonitoringSensorPayload = {
      mon_source_id: sourceId || "",
      sensor_name: sensorName,
      sensor_type: sensorType,
      active: active ? 1 : 0,
    };
    if (groupIds[0]) {
      payload.sensor_group_id = groupIds[0];
    }
    await onSubmit(payload);
    router.refresh();
  };

  return (
    <>
      <form id="sensor-form" noValidate onSubmit={handleSubmit}>
        <Dialog.Body>
          <HStack>
            <Field.Root required invalid={!!errors.srcId} mb={errors.srcId ? 6 : 4}>
              <Field.Label>Source</Field.Label>
              <Select.Root
                collection={sourceCollection}
                value={sourceId ? [sourceId] : []}
                onValueChange={(e) => {setSourceId(e.value[0])
                  if (errors.srcId) {
                    setErrors((prev) => ({
                      ...prev,
                      srcId: undefined,
                    }));
                  }
                }}
                disabled={isSourceLocked}
                rounded="sm"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger borderColor={!errors.srcId ? "gray.500" : "none"}>
                    <Select.ValueText placeholder="Select source" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    {!isSourceLocked && <Select.ClearTrigger />}
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content borderWidth="1px" shadow="md" mt="-4px" mb="-4px" borderColor="gray.500">
                    {sourceCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
              <Field.ErrorText position="absolute" left={0} top="100%">{errors.srcId}</Field.ErrorText>
            </Field.Root>
            <SourceCreateModal projectId={fixedProjectId} locationId={fixedLocationId}
              trigger={
                <IconButton mt="auto" mb={errors.srcId ? 6 : 4} aria-label="New Source" borderColor="gray.500" variant="outline" disabled={isSourceLocked}>
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
                value={groupIds}
                onValueChange={(e) => setGroupIds(e.value)}
                disabled={!sourceId}
                rounded="sm"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger borderColor="gray.500">
                    <Select.ValueText placeholder={!sourceId ? "Select a source first" : "[Optional] Select group"} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    {!isSourceLocked && <Select.ClearTrigger />}
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content borderWidth="1px" shadow="md" mt="-4px" mb="-4px" borderColor="gray.500">
                    {groupCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Field.Root>
            <IconButton mt="auto" mb={4} aria-label="New Group" borderColor="gray.500" variant="outline" disabled={!sourceId}>
              <Plus size={16} />
            </IconButton>
          </HStack>
          <Field.Root required invalid={!!errors.senName} mb={errors.senName ? 6 : 4}>
            <Field.Label>Sensor Name</Field.Label>
            <Input value={sensorName} onChange={(e) => setSensorName(e.target.value)} borderColor={!errors.senName ? "gray.500" : "none"}/>
            <Field.ErrorText position="absolute" left={0} top="100%">{errors.senName}</Field.ErrorText>
          </Field.Root>

          <Field.Root required invalid={!!errors.senType} mb={errors.senType ? 6 : 4}>
            <Field.Label>Sensor Type</Field.Label>
            <Input value={sensorType} onChange={(e) => setSensorType(e.target.value)} borderColor={!errors.senType ? "gray.500" : "none"}/>
            <Field.ErrorText position="absolute" left={0} top="100%">{errors.senType}</Field.ErrorText>
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
          <Button colorScheme="yellow" type="submit">{submitLabel}</Button>
        </Dialog.Footer>
      </form>
      <Dialog.CloseTrigger asChild>
        <CloseButton size="sm" />
      </Dialog.CloseTrigger>
    </>
  );
}

// ==============================
// SensorCreateModal
// ==============================
export function SensorCreateModal({ trigger, onCreated, projectId, locationId, sourceId }: BaseSensorModalProps) {
  const [open, setOpen] = useState(false);
  const handleCreate = async (payload: MonitoringSensorPayload) => {
    try {
      const created = await createSensor(payload);
      toaster.create({ description: "Sensor created successfully", type: "success" });
      onCreated?.(created);
      setOpen(false);
    } catch (err) {
      toaster.create({
        description: `Failed to create Sensor: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root size="md" open={open}
      onOpenChange={({ open }) => setOpen(open)}>
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
            <SensorForm onSubmit={handleCreate} initialProjectId={projectId} initialLocationId={locationId} initialSourceId={sourceId} submitLabel="Create" />
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
  const [open, setOpen] = useState(false);
  const handleUpdate = async (payload: MonitoringSensorPayload) => {
    if (!sensor) return;
  
    try {
      const edited = await updateSensor(sensor.id, payload);
      toaster.create({ description: "Sensor updated successfully", type: "success" });
      onEdited?.(edited);
      setOpen(false);
    } catch (err) {
      toaster.create({
        description: `Failed to update Sensor: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root size="md" open={open}
      onOpenChange={({ open }) => setOpen(open)}>
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
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch (err) {
      toaster.create({
        description: `Failed to delete Sensor: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root size="sm" open={open}
      onOpenChange={({ open }) => setOpen(open)}>
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