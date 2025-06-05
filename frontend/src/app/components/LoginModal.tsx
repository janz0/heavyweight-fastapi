// app/components/LoginModal.tsx
"use client";

import React from "react";
import { Dialog, Portal, IconButton } from "@chakra-ui/react";
import { X } from "lucide-react";
import LoginForm from "./LoginForm";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Log In</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label="Close login dialog"
                  variant="ghost"
                >
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <LoginForm onSuccess={onClose} />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}