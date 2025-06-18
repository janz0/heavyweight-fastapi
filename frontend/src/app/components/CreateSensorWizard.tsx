// File: app/components/CreateSensorWizard.tsx
"use client";

import React, { FormEvent, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  Portal,
  Button,
  Input,
  Field,
  Select,
  Switch,
  IconButton,
  createListCollection,
} from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";
import { X } from "lucide-react";
import { createSensor, updateSensor } from "@/services/sensors";
import type { MonitoringSensor, MonitoringSensorCreate, MonitoringSensorUpdate } from "@/types/sensor";
import { listSources } from "@/services/sources";
import type { Source } from "@/types/source";

interface CreateSensorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  sensor?: MonitoringSensor;
}

export function CreateSensorWizard({ isOpen, onClose, sensor }: CreateSensorWizardProps) {
  const { colorMode } = useColorMode();
  const bg       = colorMode === 'light' ? 'whiteAlpha.600' : 'blackAlpha.600';
  const cardBg   = colorMode === 'light' ? 'white'     : 'gray.700';
  const text     = colorMode === 'light' ? 'gray.800'  : 'gray.200';
  const accent   = colorMode === 'light' ? '#3B82F6'   : '#60A5FA';

  // track whether we're in edit or create mode as soon as dialog opens
  const [localEditMode, setLocalEditMode] = useState<boolean>(false);
  useEffect(() => {
    if (isOpen) {
      setLocalEditMode(Boolean(sensor));
    }
  }, [isOpen, sensor]);

  const titleText = localEditMode ? "Edit Sensor" : "Create Sensor";
  const actionText = localEditMode ? "Save" : "Create";
  const router = useRouter();

  const [sources, setSources] = useState<Source[]>([]);
  const [monSourceId, setMonSourceId] = useState<string>(sensor?.mon_source_id ?? "");
  const [sensorGroupId, setSensorGroupId] = useState<string>(sensor?.sensor_group_id ?? "");
  const [sensorName, setSensorName] = useState<string>(sensor?.sensor_name ?? "");
  const [sensorType, setSensorType] = useState<string>(sensor?.sensor_type ?? "");
  const [active, setActive] = useState<boolean>(sensor ? sensor.active === 1 : true);

  useEffect(() => {
    listSources()
      .then(setSources)
      .catch((err) => {
        console.error("Failed to load sources:", err);
        toaster.create({ description: "Could not load sources", type: "error" });
      });
  }, []);

  const sourceCollection = useMemo(
    () => createListCollection({
      items: sources.map((s) => ({ label: s.source_name, value: s.id })),
    }),
    [sources]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: MonitoringSensorCreate | MonitoringSensorUpdate = {
      mon_source_id: monSourceId,
      sensor_group_id: sensorGroupId,
      sensor_name: sensorName,
      sensor_type: sensorType,
      active: active ? 1 : 0,
    };
    try {
      if (localEditMode && sensor) {
        await updateSensor(sensor.id, payload as MonitoringSensorUpdate);
        toaster.create({ description: "Sensor updated successfully", type: "success" });
      } else {
        await createSensor(payload as MonitoringSensorCreate);
        toaster.create({ description: "Sensor created successfully", type: "success" });
      }
      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      toaster.create({
        description: `${actionText} sensor failed: ${(err as Error).message}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (sensor) {
      setMonSourceId(sensor.mon_source_id);
      setSensorGroupId(sensor.sensor_group_id ?? "");
      setSensorName(sensor.sensor_name);
      setSensorType(sensor.sensor_type);
      setActive(sensor.active === 1);
    } else {
      // clear fields for create
      setMonSourceId("");
      setSensorGroupId("");
      setSensorName("");
      setSensorType("");
      setActive(true);
    }
  }, [sensor]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="md"
    >
      <Portal>
        <Dialog.Backdrop
          onClick={onClose}
          bg={bg}
          style={{ backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Positioner>
          <Dialog.Content bg={cardBg} color={text} borderRadius="md" p={6}>
            <Dialog.Header>
              <Dialog.Title>{titleText}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} color={text} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <form id="sensor-form" onSubmit={handleSubmit}>
                <Field.Root required mb={4}>
                  <Field.Label>Source</Field.Label>
                  <Select.Root
                    collection={sourceCollection}
                    value={monSourceId ? [monSourceId] : []}
                    onValueChange={(e) => setMonSourceId(e.value[0])}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select source" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.ClearTrigger />
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
                    onChange={(e) => setSensorGroupId(e.target.value)}
                  />
                </Field.Root>
                <Field.Root required mb={4}>
                  <Field.Label>Sensor Name</Field.Label>
                  <Input
                    value={sensorName}
                    onChange={(e) => setSensorName(e.target.value)}
                  />
                </Field.Root>
                <Field.Root required mb={4}>
                  <Field.Label>Sensor Type</Field.Label>
                  <Input
                    value={sensorType}
                    onChange={(e) => setSensorType(e.target.value)}
                  />
                </Field.Root>
                <Field.Root display="flex" alignItems="center" mb={4}>
                  <Field.Label mb={0} mr="auto">Active</Field.Label>
                  <Switch.Root
                    checked={active}
                    onCheckedChange={({ checked }) => setActive(checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control bg={accent} _checked={{ bg: 'green.400' }}>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </Field.Root>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="ghost" onClick={onClose} mr={3}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button colorScheme="blue" type="submit" form="sensor-form">
                {actionText}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}