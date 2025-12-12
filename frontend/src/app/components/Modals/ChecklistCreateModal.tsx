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
  Box,
  Text,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { createChecklist, listChecklistTemplates, listTemplateCategories, listCategoryItems } from "@/services/checklists";
import { ChecklistTemplate, ChecklistTemplateCategory, ChecklistTemplateItem } from "@/types/checklist";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

type TemplateCategoryWithItems = ChecklistTemplateCategory & {
  items: ChecklistTemplateItem[];
};

export function ChecklistCreateModal({
  isOpen,
  onClose,
  locationId,
}: { isOpen: boolean; onClose: () => void; locationId: string }) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCats, setPreviewCats] = useState<TemplateCategoryWithItems[]>([]);

  const router = useRouter();

  useEffect(() => {
    listChecklistTemplates()
      .then(setTemplates)
      .catch(() => {
        toaster.create({ description: "Failed to load templates", type: "error" });
      });
  }, []);

  useEffect(() => {
    if (!templateId) {
      setPreviewCats([]);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    (async () => {
      try {
        const cats = await listTemplateCategories(templateId);
        const catsWithItems: TemplateCategoryWithItems[] = await Promise.all(
          cats.map(async (cat) => {
            const items = await listCategoryItems(cat.id);
            return { ...cat, items };
          })
        );
        if (!cancelled) {
          setPreviewCats(catsWithItems);
        }
      } catch {
        if (!cancelled) {
          toaster.create({
            description: "Failed to load template details",
            type: "error",
          });
          setPreviewCats([]);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

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
  const selectedTemplate = templates.find((t) => t.id === templateId);
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));

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
                    rounded="sm"
                    _focusWithin={{
                      outline: "2px solid",
                      outlineColor: "var(--chakra-colors-blue-400)",
                      outlineOffset: "2px",
                    }}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select template" />
                        <Select.Indicator />
                      </Select.Trigger>
                       <Select.IndicatorGroup>
                          <Select.ClearTrigger />
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>

                    <Select.Positioner>
                      <Select.Content>
                        {templateCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>
                 {selectedTemplate && (
                  <Box
                    mb={4}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="bg.subtle"
                    maxH="260px"
                    overflowY="auto"
                  >
                    <Text fontWeight="semibold">{selectedTemplate.name}</Text>
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      Created: {formatDate(selectedTemplate.created_at)}
                    </Text>
                    {selectedTemplate.project_id && (
                      <Text fontSize="xs" color="fg.muted">
                        Project ID: {selectedTemplate.project_id}
                      </Text>
                    )}

                    {previewLoading && (
                      <Text fontSize="xs" color="fg.muted" mt={2}>
                        Loading template contents…
                      </Text>
                    )}

                    {!previewLoading && previewCats.length > 0 && (
                      <Box mt={3}>
                        {previewCats.map((cat) => (
                          <Box key={cat.id} mb={2}>
                            <Text fontSize="sm" fontWeight="semibold">
                              {cat.title}
                            </Text>
                            {cat.items.map((item) => (
                              <Text key={item.id} fontSize="sm" color="fg.muted">
                                • {item.prompt}
                              </Text>
                            ))}
                          </Box>
                        ))}
                      </Box>
                    )}

                    {!previewLoading && previewCats.length === 0 && (
                      <Text fontSize="xs" color="fg.muted" mt={2}>
                        This template has no categories/items yet.
                      </Text>
                    )}
                  </Box>
                )}
                <Field.Root mb={4}>
                  <Field.Label>Notes</Field.Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                    _focusWithin={{
                      outline: "2px solid",
                      outlineColor: "var(--chakra-colors-blue-400)",
                      outlineOffset: "2px",
                    }}
                  />
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
