// File: app/projects/components/LocationModals.tsx
'use client';

// React + Next Imports
import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Chakra Imports + Icons
import { Button, CloseButton, Dialog, Field, Flex, HStack, IconButton, Input, Portal, Switch, Text, Textarea } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { useColorMode } from "@/app/src/components/ui/color-mode";

// Services + Types
import { createProject, updateProject, deleteProject } from '@/services/projects';
import type { Project, ProjectPayload } from '@/types/project';

interface BaseProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (p: Project) => void;
  onEdited?: (p: Project) => void;
  onDeleted?: (id: string) => void;
  project?: Project;
}

// ==============================
// Shared Form Component
// ==============================
function ProjectForm({
  onSubmit,
  onClose,
  initialData,
  submitLabel,
}: {
  onSubmit: (payload: ProjectPayload) => Promise<void>;
  onClose: () => void;
  initialData?: Project;
  submitLabel: string;
}) {
  const { colorMode } = useColorMode();
  const bc = colorMode === "light" ? "black" : "white";

  const today = new Date().toISOString().split('T')[0];
  const [projectName, setProjectName] = useState(initialData?.project_name || '');
  const [projectNumber, setProjectNumber] = useState(initialData?.project_number || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || today);
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [active, setActive] = useState(initialData?.active || 1);

  useEffect(() => {
    if (initialData) {
      setProjectName(initialData.project_name);
      setProjectNumber(initialData.project_number || '');
      setDescription(initialData.description || '');
      setStartDate(initialData.start_date);
      setEndDate(initialData.end_date || '');
      setActive(initialData.active);
    } else {
      setProjectName('');
      setProjectNumber('');
      setDescription('');
      setStartDate(today);
      setEndDate('');
      setActive(1);
    }
  }, [initialData, today]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: ProjectPayload = {
      project_name: projectName,
      description,
      start_date: startDate,
      active,
      status: active === 1 ? 'Active' : 'On-Hold',
    };
    if (projectNumber) payload.project_number = projectNumber;
    if (endDate) payload.end_date = endDate;

    await onSubmit(payload);
  };

  return (
    <form id="project-form" onSubmit={handleSubmit}>
      <Field.Root required mb={4}>
        <Field.Label>Project Name</Field.Label>
        <Input value={projectName} borderColor={bc} onChange={(e) => setProjectName(e.target.value)} />
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label>Project Number</Field.Label>
        <Input placeholder="Optional" value={projectNumber} borderColor={bc} onChange={(e) => setProjectNumber(e.target.value)} />
      </Field.Root>

      <Field.Root required mb={4}>
        <Field.Label>Description</Field.Label>
        <Textarea rows={3} value={description} borderColor={bc} onChange={(e) => setDescription(e.target.value)} />
      </Field.Root>

      <HStack gap={4} mb={4}>
        <Field.Root required>
          <Field.Label>Start Date</Field.Label>
          <Input type="date" value={startDate} borderColor={bc} onChange={(e) => setStartDate(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>End Date</Field.Label>
          <Input type="date" value={endDate} borderColor={bc} onChange={(e) => setEndDate(e.target.value)} />
        </Field.Root>
      </HStack>

      <Field.Root justifyItems={"center"}>
        <Flex gap="2">
        <Field.Label>Active</Field.Label>
        <Switch.Root
          checked={active === 1}
          onCheckedChange={({ checked }) => setActive(checked ? 1 : 0)}
        >
          <Switch.HiddenInput />
          <Switch.Control _checked={{ bg: 'green.400' }}>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
        </Flex>
      </Field.Root>

      <Dialog.Footer>
        <Button mr={3} type="button" onClick={() => onClose()}>Cancel</Button>
        <Button type="submit">{submitLabel}</Button>
      </Dialog.Footer>
    </form>
  );
}

// ==============================
// ProjectCreateModal
// ==============================
export function ProjectCreateModal({ isOpen, onClose, onCreated }: BaseProjectModalProps) {

  const handleCreate = async (payload: ProjectPayload) => {
    try {
      const created = await createProject(payload);
      toaster.create({ description: 'Project created successfully', type: 'success' });
      onCreated?.(created);
      onClose();
    } catch (err) {
      toaster.create({
        description: `Failed to create Project: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="lg">
      <Portal>
        <Dialog.Positioner>
          <Dialog.Backdrop onClick={onClose} zIndex={1500}/>
          <Dialog.Content border="2px solid" zIndex={1600}>
            <Dialog.Header>
              <Dialog.Title>Create Project</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <ProjectForm onSubmit={handleCreate} onClose={onClose} submitLabel="Create" />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// ProjectEditModal
// ==============================
export function ProjectEditModal({ isOpen, onClose, project, onEdited }: BaseProjectModalProps) {

  const handleUpdate = async (payload: ProjectPayload) => {
    if (!project) return;
    try {
      const edited = await updateProject(project.id, payload);
      toaster.create({ description: 'Project updated successfully', type: 'success' });
      onEdited?.(edited);
      onClose();
    } catch (err) {
      toaster.create({
        description: `Failed to update Project: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="lg">
      <Portal>
        <Dialog.Positioner>
          <Dialog.Backdrop onClick={onClose} zIndex={1500}/>
          <Dialog.Content border="2px solid" zIndex={1600}>
            <Dialog.Header>
              <Dialog.Title>Edit Project</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <ProjectForm onSubmit={handleUpdate} onClose={onClose} initialData={project} submitLabel="Save" />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// ProjectDeleteModal
// ==============================
export function ProjectDeleteModal({ isOpen, onClose, project, onDeleted }: BaseProjectModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleConfirm = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      toaster.create({ description: 'Project deleted', type: 'success' });
      onClose();

      const detailRoute = /^\/projects\/[^\/]+$/;
      if (detailRoute.test(pathname)) {
        router.back();
      } else {
        onDeleted?.(project.id);
      }
    } catch (err) {
      toaster.create({
        description: `Failed to delete Project: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="sm">
      <Portal>
        <Dialog.Positioner>
          <Dialog.Backdrop onClick={onClose} zIndex={1500}/>
          <Dialog.Content border="2px solid" zIndex={1600}>
            <Dialog.Header>
              <Dialog.Title>Delete Project</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} _hover={{ backgroundColor: 'gray.500' }} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Are you sure you want to delete{' '}
                <Text as="span" fontWeight="bold">{project?.project_name}</Text>?
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirm}>Delete</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
