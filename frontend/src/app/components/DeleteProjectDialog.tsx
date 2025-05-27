'use client';

// File: app/components/DeleteProjectDialog.tsx
import React from 'react'
import {
  Dialog,
  Portal,
  Button,
  Text,
  CloseButton,
} from '@chakra-ui/react'
import { useRouter, usePathname } from 'next/navigation'
import { toaster } from '@/components/ui/toaster'
import { deleteProject } from '@/services/projects'
import type { Project } from '@/types/project'

interface Props {
  isOpen: boolean
  onClose(): void
  project?: Project
}

export function DeleteProjectDialog({ isOpen, onClose, project }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const handleConfirm = async () => {
    if (!project) return

    try {
      await deleteProject(project.id)
      toaster.create({ description: 'Project deleted', type: 'success' })
      onClose()

      // if we're on /projects/<id> go back, else just refresh the list
      const detailRoute = /^\/projects\/[^\/]+$/  
      if (detailRoute.test(pathname)) {
        router.back()
      } else {
        router.refresh()
      }
    } catch (err: any) {
      toaster.create({ description: `Delete failed: ${err.message}`, type: 'error' })
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()} size="sm">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content
            bg="#1C2633"
            color="white"
            border="1px solid"
            borderColor="whiteAlpha.300"
            boxShadow="0 0 0 1px rgba(255,255,255,0.2),0 10px 30px rgba(0,0,0,0.5)"
          >
            <Dialog.Header>
              <Dialog.Title>Delete Project</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" color={"white"} onClick={onClose} _hover={{backgroundColor: "gray.500"}}/>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Are you sure you want to delete{' '}
                <Text as="span" fontWeight="bold">
                  {project?.project_name}
                </Text>
                ?
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorScheme="red" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirm}>
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}