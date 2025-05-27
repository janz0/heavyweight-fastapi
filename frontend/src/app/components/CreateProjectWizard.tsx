'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import { useRouter } from "next/navigation"
import {
  Dialog,
  Portal,
  Button,
  HStack,
  Textarea,
  Input,
  Switch,
  IconButton,
  Field,
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { X } from 'lucide-react';
import { createProject, updateProject } from '@/services/projects';
import type { Project, ProjectPayload } from '@/types/project';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, the wizard will load this project and switch into "edit" mode */
  project?: Project;
}

export function CreateProjectWizard({ isOpen, onClose, project }: CreateProjectWizardProps) {
  const editMode = Boolean(project);
  const titleText = editMode ? 'Edit Project' : 'Create Project';
  const actionText = editMode ? 'Save' : 'Create';
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();

  const [projectName, setProjectName] = useState<string>(project?.project_name || '');
  const [projectNumber, setProjectNumber] = useState<string>(project?.project_number || '');
  const [description, setDescription] = useState<string>(project?.description || '');
  const [startDate, setStartDate] = useState<string>(project?.start_date || today);
  const [endDate, setEndDate] = useState<string>(project?.end_date || '');
  const [active, setActive] = useState<number>(project?.active || 1);

  useEffect(() => {
    if (project) {
      setProjectName(project.project_name);
      setProjectNumber(project.project_number || '');
      setDescription(project.description || '');
      setStartDate(project.start_date);
      setEndDate(project.end_date || '');
      setActive(project.active);
    } else {
      setProjectName('');
      setProjectNumber('');
      setDescription('');
      setStartDate(today);
      setEndDate('');
      setActive(1);
    }
  }, [project, today]);

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

    try {
      if (editMode && project) {
        await updateProject(project.id, payload);
        toaster.create({ description: 'Project updated successfully', type: 'success' });
      } else {
        await createProject(payload);
        toaster.create({ description: 'Project created successfully', type: 'success' });
      }
      onClose();
      router.refresh()
    } catch (err: any) {
      console.error(err);
      const message = editMode ? 'Failed to update project' : 'Failed to create project';
      toaster.create({ description: `${message}: ${err.message}`, type: 'error' });
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
              <form id="project-form" onSubmit={handleSubmit}>
                <Field.Root required mb={4}>
                  <Field.Label>Project Name</Field.Label>
                  <Input
                    bg="#29374C"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </Field.Root>

                <Field.Root mb={4}>
                  <Field.Label>Project Number</Field.Label>
                  <Input
                    bg="#29374C"
                    placeholder="Optional"
                    value={projectNumber}
                    onChange={(e) => setProjectNumber(e.target.value)}
                  />
                </Field.Root>

                <Field.Root required mb={4}>
                  <Field.Label>Description</Field.Label>
                  <Textarea
                    bg="#29374C"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field.Root>

                <HStack gap={4} mb={4}>
                  <Field.Root required>
                    <Field.Label>Start Date</Field.Label>
                    <Input
                      type="date"
                      bg="#29374C"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>End Date</Field.Label>
                    <Input
                      type="date"
                      bg="#29374C"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field.Root>
                </HStack>

                <Field.Root display="flex" alignItems="center" mb={4}>
                  <Field.Label mr="auto" mb="0">Active</Field.Label>
                  <Switch.Root
                    name="active"
                    checked={active === 1}
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
              <Button colorScheme="yellow" type="submit" form="project-form">
                {actionText}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
