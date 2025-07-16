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
  Portal,
  Switch,
  Select,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";
import {
  createMonitoringGroup,
  //updateMonitoringGroup,
  deleteMonitoringGroup,
} from "@/services/monitoringGroups";
import type {
  MonitoringGroup,
  MonitoringGroupPayload,
} from "@/types/monitoringGroup";
import { listLocations } from "@/services/locations";
import type { Location } from "@/types/location";

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
  locationId: string;
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
