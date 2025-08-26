// app/checklists/components/ChecklistCreateModal.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Select,
  IconButton,
  createListCollection,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { createChecklist, listChecklistTemplates } from "@/services/checklists";
import { ChecklistTemplate } from "@/types/checklist";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

export function ChecklistCreateModal({
  isOpen,
  onClose,
  locationId,
}: { isOpen: boolean; onClose: () => void; locationId: string }) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    listChecklistTemplates()
      .then(setTemplates)
      .catch(() => {
        toaster.create({ description: "Failed to load templates", type: "error" });
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!templateId) {
      toaster.create({ description: "Please select a template", type: "error" });
      return;
    }
    try {
      setLoading(true);
      await createChecklist({ location_id: locationId, template_id: templateId, notes });
      toaster.create({ description: "Checklist created successfully", type: "success" });
      onClose();
      router.refresh();
    } catch (err) {
      toaster.create({
        description: `Create failed: ${(err as Error).message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const templateCollection = createListCollection({
    items: templates.map((tpl) => ({
      label: tpl.name,
      value: tpl.id,
    })),
  });
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid">
            <Dialog.Header>
              <Dialog.Title>Add Checklist</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <form onSubmit={handleSubmit}>
              <Dialog.Body>
                <Field.Root required mb={4}>
                  <Field.Label>Template</Field.Label>
                  <Select.Root
                    collection={templateCollection}
                    value={templateId ? [templateId] : []}
                    onValueChange={(e) => setTemplateId(e.value[0])}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select template" />
                      </Select.Trigger>
                      <Select.Indicator />
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {templates.map((tpl) => (
                          <Select.Item key={tpl.id} item={{ label: "placeholder", value: tpl.id }}>
                            Placeholder
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>Notes</Field.Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field.Root>
              </Dialog.Body>
              <Dialog.Footer>
                <Button colorScheme="gray" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="yellow" type="submit" loading={loading}>
                  Create
                </Button>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
