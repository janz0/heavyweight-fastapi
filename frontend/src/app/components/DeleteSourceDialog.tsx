'use client';

// File: app/components/DeleteSourceDialog.tsx
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
import { deleteSource } from '@/services/sources'
import type { Source } from '@/types/source'

interface Props {
  isOpen: boolean
  onClose(): void
  source?: Source
}

export function DeleteSourceDialog({ isOpen, onClose, source }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const handleConfirm = async () => {
    if (!source) return

    try {
      await deleteSource(String(source.id))
      toaster.create({ description: 'Source deleted', type: 'success' })
      onClose()

      // if we're on /sources/<id> go back, else just refresh the list
      const detailRoute = /^\/sources\/[^\/]+$/
      if (detailRoute.test(pathname)) {
        router.back()
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toaster.create({
        description: `Delete failed: ${msg}`,
        type: 'error',
      })
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
              <Dialog.Title>Delete Source</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="white"
                  onClick={onClose}
                  _hover={{ backgroundColor: 'gray.500' }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <Text>
                Are you sure you want to delete{' '}
                <Text as="span" fontWeight="bold">
                  {source?.source_name}
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
