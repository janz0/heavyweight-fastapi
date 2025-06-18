'use client';

import React, { FormEvent, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  Portal,
  Button,
  HStack,
  Input,
  Switch,
  IconButton,
  Field,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import { X } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/project";
import { createLocation, updateLocation } from '@/services/locations';
import type { Location, LocationPayload } from '@/types/location';

interface CreateLocationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  /** When provided, we'll pre-fill and switch into "edit" mode */
  location?: Location;
}

export function CreateLocationWizard({
  isOpen,
  onClose,
  projectId: initialProjectId,
  location,
}: CreateLocationWizardProps) {
  const editMode   = Boolean(location);
  const titleText  = editMode ? 'Edit Location'  : 'Create Location';
  const actionText = editMode ? 'Save'   : 'Create';
  const router     = useRouter();

  // form state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId,    setProjectId]    = useState(initialProjectId);
  const [locName,      setLocName]      = useState(location?.loc_name ?? '');
  const [locNumber, setLocNumber]       = useState(location?.loc_number ?? '');
  const [latitude,     setLatitude]     = useState<string>(location  ? String(location.lat) : "");
  const [longitude,    setLongitude]    = useState<string>(location ? String(location.lon) : "");
  const [frequency,    setFrequency]    = useState(location?.frequency       ?? '');
  const [active,       setActive]       = useState(location?.active         ?? 1);

  // when `location` changes (e.g. user clicked edit), re-sync state
  useEffect(() => {
    if (location) {
      setProjectId(location.project_id);
      setLocName(location.loc_name);
      setLocNumber(location?.loc_number || '');
      setLatitude(String(location.lat));
      setLongitude(String(location.lon));
      setFrequency(location.frequency);
      setActive(location.active);
    } else {
      setProjectId(initialProjectId);
      setLocName('');
      setLocNumber('');
      setLatitude('');
      setLongitude('');
      setFrequency('');
      setActive(1);
    }
  }, [location, initialProjectId]);

  const projectCollection = useMemo(() => 
  createListCollection({
    items: projects.map((p) => ({
      label: p.project_name,
      value: p.id
    }))
  }), 
  [projects]
);

  useEffect(() => {
    listProjects()
      .then((data) => setProjects(data))
      .catch((err) => {
        console.error("Failed to load projects", err);
        toaster.create({
          description: "Failed to load projects",
          type: "error",
        });
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // parse & validate
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      toaster.create({ description: 'Invalid latitude or longitude', type: 'error' });
      return;
    }
    const payload: LocationPayload = {
      loc_name: locName,
      lat: latNum,
      lon: lonNum,
      frequency,
      active,
    };
    if (projectId) payload.project_id = projectId;
    if (locNumber) payload.loc_number = locNumber;

    try {
      if (editMode && location) {
        await updateLocation(location.id, payload);
        toaster.create({ description: 'Location updated successfully', type: 'success' });
      } else {
        await createLocation(payload);
        toaster.create({ description: 'Location created successfully', type: 'success' });
      }
      onClose();
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toaster.create({
          description: `Failed: ${err.message}`,
          type: 'error',
        });
      } else {
        // err might be a string, object, etc. Fallback to a generic message:
        toaster.create({
          description: `Failed: ${String(err)}`,
          type: 'error',
        });
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} size="lg">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content
            bg="#1C2633"
            color="white"
            border="1px solid"
            borderColor="whiteAlpha.300"
            boxShadow="0 0 0 1px rgba(255,255,255,0.2), 0 10px 30px rgba(0,0,0,0.5)"
          >
            <Dialog.Header>
              <Dialog.Title>{titleText}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label="Close dialog"
                  variant="ghost"
                  color="white"
                  onClick={onClose}
                >
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <form id="location-form" onSubmit={handleSubmit}>
                <Field.Root required mb={4}>
                  <Field.Label>Location Name</Field.Label>
                  <Input
                    bg="#29374C"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                  />
                </Field.Root>

                <Field.Root mb={4}>
                  <Field.Label>Location Number</Field.Label>
                  <Input
                    bg="#29374C"
                    placeholder="Optional"
                    value={locNumber}
                    onChange={(e) => setLocNumber(e.target.value)}
                  />
                </Field.Root>
                <Field.Root required mb={4}>
                  <Field.Label>Project</Field.Label>
                  <Select.Root
                    collection={projectCollection}
                    value={projectId ? [projectId] : []}
                    onValueChange={(e) => setProjectId(e.value[0])}
                    disabled={!!initialProjectId}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger bg="#29374B">
                        <Select.ValueText placeholder="Select project" color="white" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.ClearTrigger />
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {projectCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item} color="black" _dark={{color: "white", _hover: {outlineColor: "white"}}} _hover={{outlineStyle: "solid", outlineColor: "black", outlineWidth: 1}}>
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
                    <Input
                      type="number"
                      bg="#29374C"
                      placeholder="e.g. 37.7749"
                      value={latitude.toString()}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>Longitude</Field.Label>
                    <Input
                      type="number"
                      bg="#29374C"
                      placeholder="e.g. -122.4194"
                      value={longitude.toString()}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </Field.Root>
                </HStack>

                <Field.Root required mb={4}>
                  <Field.Label>Frequency</Field.Label>
                  <Input
                    bg="#29374C"
                    placeholder="e.g. daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  />
                </Field.Root>

                <Field.Root display="flex" alignItems="center" mb={4}>
                  <Field.Label mr="auto" mb="0">Active</Field.Label>
                  <Switch.Root
                    name="active"
                    checked={active === 1 ? true : false}
                    onCheckedChange={({ checked }) => setActive(checked ? 1 : 0)}
                    mr="auto"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control _checked={{ bg: 'green.500' }}>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </Field.Root>
              </form>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button colorScheme="gray" mr={3} onClick={onClose}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button colorScheme="yellow" type="submit" form="location-form">
                {actionText}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
