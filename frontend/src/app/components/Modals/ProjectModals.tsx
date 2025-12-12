// File: app/projects/components/LocationModals.tsx
'use client';

// React + Next Imports
import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Chakra Imports + Icons
import { Button, CloseButton, Dialog, Field, Flex, HStack, Input, Portal, Switch, Textarea } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';

// Services + Types
import { createProject, updateProject, deleteProject } from '@/services/projects';
import type { Project, ProjectPayload } from '@/types/project';

interface BaseProjectModalProps {
  isOpen?: boolean;
  trigger: React.ReactElement;
  onClose?: () => void;
  onCreated?: (p: Project) => void;
  onEdited?: (p: Project) => void;
  onDeleted?: (id: string) => void;
  onDuplicated?: (p: Project) => void;
  project?: Project;
}

// ==============================
// Shared Form Component
// ==============================
function ProjectForm({
  onSubmit,
  initialData,
  submitLabel,
}: {
  onSubmit: (payload: ProjectPayload) => Promise<void>;
  initialData?: Project;
  submitLabel: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [projectName, setProjectName] = useState(initialData?.project_name || '');
  const [projectNumber, setProjectNumber] = useState(initialData?.project_number || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || today);
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [active, setActive] = useState(initialData?.active || 1);
  const router = useRouter();

  const [errors, setErrors] = useState<{
    projName?: string;
    projNumber?: string;
    description?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setProjectName(initialData.project_name);
      setProjectNumber(initialData.project_number);
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

    const nextErrors: typeof errors = {};
    let hasError = false;

    if (!projectName.trim()) {
      nextErrors.projName = "Project name is required";
      hasError = true;
    }

    if (!projectNumber.trim()) {
      nextErrors.projNumber = "Project number is required";
      hasError = true;
    }

    if (!description.trim()) {
      nextErrors.description = "Project description is required";
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

    const payload: ProjectPayload = {
      project_name: projectName,
      description,
      start_date: startDate,
      active,
      status: active === 1 ? 'Active' : 'On-Hold',
      project_number: projectNumber,
    };
    if (endDate) payload.end_date = endDate;

    await onSubmit(payload);
    router.refresh();
  };

  return (
    <>
      <form id="project-form" noValidate onSubmit={handleSubmit}>
        <Dialog.Body>
          <Field.Root required invalid={!!errors.projName} mb={errors.projName ? 6 : 4}>
            <Field.Label>Project Name</Field.Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} borderColor={!errors.projName ? "gray.500" : "none"}/>
            <Field.ErrorText position="absolute" left={0} top="100%">{errors.projName}</Field.ErrorText>
          </Field.Root>

          <Field.Root required invalid={!!errors.projNumber} mb={errors.projNumber ? 6 : 4}>
            <Field.Label>Project Number</Field.Label>
            <Input value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)} borderColor={!errors.projNumber ? "gray.500" : "none"}/>
            <Field.ErrorText position="absolute" left={0} top="100%">{errors.projNumber}</Field.ErrorText>
          </Field.Root>

          <Field.Root required invalid={!!errors.description} mb={errors.description ? 6 : 4}>
            <Field.Label>Description</Field.Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} borderColor={!errors.description ? "gray.500" : "none"}/>
            <Field.ErrorText position="absolute" left={0} top="100%">{errors.description}</Field.ErrorText>
          </Field.Root>

          <HStack gap={4} mb={4}>
            <Field.Root required>
              <Field.Label>Start Date</Field.Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} borderColor="gray.500"/>
            </Field.Root>

            <Field.Root>
              <Field.Label>End Date</Field.Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} borderColor="gray.500"/>
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
// ProjectCreateModal
// ==============================
export function ProjectCreateModal({ trigger, onCreated }: BaseProjectModalProps) {
  const [open, setOpen] = useState(false);
  const handleCreate = async (payload: ProjectPayload) => {
    try {
      const created = await createProject(payload);
      toaster.create({ description: 'Project created successfully', type: 'success' });
      onCreated?.(created);
      setOpen(false);
    } catch (err) {
      toaster.create({
        description: `Failed to create Project: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    }
  };

  return (
    <Dialog.Root key="createproj" size="lg" open={open}
      onOpenChange={({ open }) => setOpen(open)}>
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop zIndex={2006}/>
        <Dialog.Positioner zIndex={2007}>
          <Dialog.Content border="2px solid" zIndex={2008}>
            <Dialog.Header>
              <Dialog.Title>Create Project</Dialog.Title>
            </Dialog.Header>
            <ProjectForm onSubmit={handleCreate} submitLabel="Create" />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// ProjectEditModal
// ==============================
export function ProjectEditModal({ trigger, project, onEdited }: BaseProjectModalProps) {
  const [open, setOpen] = useState(false);
  const handleUpdate = async (payload: ProjectPayload) => {
    if (!project) return;
    try {
      const edited = await updateProject(project.id, payload);
      toaster.create({ description: 'Project updated successfully', type: 'success' });
      onEdited?.(edited);
      setOpen(false);
    } catch (err) {
      toaster.create({
        description: `Failed to update Project: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    }
  };

  return (
    <Dialog.Root size="lg" open={open}
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
              <Dialog.Title>Edit Project</Dialog.Title>
            </Dialog.Header>
            <ProjectForm onSubmit={handleUpdate} initialData={project} submitLabel="Save" />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ==============================
// ProjectDeleteModal
// ==============================
export function ProjectDeleteModal({ trigger, project, onDeleted }: BaseProjectModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      toaster.create({ description: 'Project deleted', type: 'success' });
      const detailRoute = /^\/projects\/[^\/]+$/;
      if (detailRoute.test(pathname)) {
        router.back();
      } else {
        onDeleted?.(project.id);
      }
      setOpen(false);
    } catch (err) {
      toaster.create({
        description: `Failed to delete Project: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
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
              <Dialog.Title>Delete Project</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm"/>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
                Are you sure you want to delete <strong>{project?.project_name}</strong>
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

export function ProjectDuplicateModal({ trigger, project, onDuplicated }: BaseProjectModalProps) {
  const handleDuplicate = async (payload: ProjectPayload) => {
    const duplicated = await createProject(payload);
    toaster.create({ description: 'Project created successfully', type: 'success' });
    onDuplicated?.(duplicated);
  };

  const cloneData: Project | undefined = project
    ? { ...project, project_name: '', project_number: '' }
    : undefined;

  return (
    <Dialog.Root size="lg">
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
              <Dialog.Title>Duplicate Project</Dialog.Title>
            </Dialog.Header>
            <ProjectForm
              onSubmit={handleDuplicate}
              initialData={cloneData}
              submitLabel="Create"
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}