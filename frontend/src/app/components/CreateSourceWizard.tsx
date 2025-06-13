// File: app/components/CreateSourceWizard.tsx
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
import { toaster } from "@/components/ui/toaster";
import { X } from "lucide-react";
import { createSource, updateSource } from "@/services/sources";
import type { Source, SourceCreatePayload, SourceUpdatePayload } from "@/types/source";
import { listProjects } from "@/services/projects";
import { listLocations } from "@/services/locations";
import type { Project } from "@/types/project";
import type { Location }from "@/types/location";

interface CreateSourceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  source?: Source;
}

const INTERVAL_OPTIONS = [
  { label: "5 minutes", value: "5min"},
  { label: "10 minutes", value: "10min"},
  { label: "15 minutes", value: "15min"},
]

export function CreateSourceWizard({ isOpen, onClose, source }: CreateSourceWizardProps) {
  const editMode = Boolean(source);
  const titleText = editMode ? "Edit Source" : "Create Source";
  const actionText = editMode ? "Save" : "Create";
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>(source?.details ? [source.details.project_id] : []);
  const [locationIds, setLocationIds] = useState<string[]>(source ? [source.mon_loc_id] : []);
  const [sourceName, setSourceName] = useState<string>(source?.source_name || "");
  const [folderPath, setFolderPath] = useState<string>(source?.folder_path || "");
  const [fileKeyword, setFileKeyword] = useState<string>(source?.file_keyword || "");
  const [fileType, setFileType] = useState<string>(source?.file_type || "");
  const [sourceType, setSourceType] = useState<string>(source?.source_type || "");
  const [active, setActive] = useState<boolean>(source ? source.active === 1 : true);
  const [interval, setInterval] = useState<string>(() => {
    if (!source) return "";
    try {
      const cfg =
        typeof source.config === "string"
          ? JSON.parse(source.config)
          : source.config as { interval?: string };
      return cfg.interval ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    listProjects()
      .then((all) => setProjects(all))
      .catch((err) => {
        console.error("Failed to load projects:", err);
        toaster.create({ description: "Could not load projects", type: "error" });
      });
  }, []);

  const projectCollection = useMemo(
    () =>
      createListCollection({
        items: projects.map((p) => ({
          label: p.project_name,
          value: p.id,
        })),
      }),
    [projects]
  );

  useEffect(() => {
    if (projectIds[0]) {
      // fetch only for selected project
      listLocations(projectIds[0])
        .then((locs) => setLocations(locs))
        .catch((err) => {
          console.error("Failed to load locations:", err);
          toaster.create({ description: "Could not load locations", type: "error" });
        });
    } else {
      // no project → aggregate all locations across projects
      Promise.all(projects.map((p) => listLocations(p.id)))
        .then((arrays) => setLocations(arrays.flat()))
        .catch((err) => {
          console.error("Failed to load all locations:", err);
          toaster.create({ description: "Could not load locations", type: "error" });
        });
    }
  }, [projectIds, projects]);

  const locationCollection = useMemo(
    () =>
      createListCollection({
        items: locations.map((l) => ({
          label: l.loc_name,
          value: l.id,
        })),
      }),
    [locations]
  );

  const intervalCollection = createListCollection({
    items: INTERVAL_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value })),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const location_id = locationIds[0] || "";

    const payload: SourceCreatePayload | SourceUpdatePayload = {
      mon_loc_id: location_id,
      source_name: sourceName,
      folder_path: folderPath,
      file_keyword: fileKeyword,
      file_type: fileType,
      source_type: sourceType,
      config: JSON.stringify({ interval }),
      active: active ? 1 : 0,
    };

    try {
      if (editMode && source) {
        await updateSource(String(source.id), payload as SourceUpdatePayload);
        toaster.create({ description: "Source updated successfully", type: "success" });
      } else {
        await createSource(payload as SourceCreatePayload);
        toaster.create({ description: "Source created successfully", type: "success" });
      }
      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      const msg = editMode ? "Failed to update source" : "Failed to create source";
      toaster.create({
        description: `${msg}: ${(err as Error).message}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (source) {
      // pull project_id out of details, and mon_loc_id for location
      setProjectIds(source.details ? [source.details.project_id] : []);
      setLocationIds([source.mon_loc_id]);

      // map the rest of the fields
      setSourceName(source.source_name);
      setFolderPath(source.folder_path);
      setFileKeyword(source.file_keyword);
      setFileType(source.file_type);
      setSourceType(source.source_type);

      // parse config.interval again on prop change
      try {
        const cfg =
          typeof source.config === "string"
            ? JSON.parse(source.config)
            : source.config as { interval?: string };
        setInterval(cfg.interval ?? "");
      } catch {
        setInterval("");
      }

      setActive(source.active === 1);
    } else {
      // clearing for “create” mode
      setProjectIds([]);
      setLocationIds([]);
      setSourceName("");
      setFolderPath("");
      setFileKeyword("");
      setFileType("");
      setSourceType("");
      setInterval("");
      setActive(true);
    }
  }, [source]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="lg">
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
              <form id="source-form" onSubmit={handleSubmit}>
                {/* Project */}
                <Field.Root required mb={4}>
                  <Field.Label>Project</Field.Label>
                  <Select.Root
                    collection={projectCollection}
                    value={projectIds}
                    onValueChange={(e) => setProjectIds(e.value)}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger bg="#29374B">
                        <Select.ValueText placeholder="Select project" color="white"/>
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.ClearTrigger color="white"/>
                        <Select.Indicator color="white"/>
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {projectCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item} color="black" _hover={{outlineStyle: "solid", outlineColor: "black", outlineWidth: 1}}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>

                {/* Location */}
                <Field.Root required mb={4} color="white">
                  <Field.Label>Location</Field.Label>
                  <Select.Root
                    collection={locationCollection}
                    value={locationIds}
                    onValueChange={(e) => setLocationIds(e.value)}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger bg="#29374C">
                        <Select.ValueText placeholder="Select location" color="white"/>
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.ClearTrigger color="white"/>
                        <Select.Indicator color="white"/>
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {locationCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item} color="black" _hover={{outlineStyle: "solid", outlineColor: "black", outlineWidth: 1}}>
                            {item.label}
                            <Select.ItemIndicator/>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>

                {/* Source Name */}
                <Field.Root required mb={4}>
                  <Field.Label>Source Name</Field.Label>
                  <Input
                    bg="#29374C"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                  />
                </Field.Root>

                {/* Folder Path */}
                <Field.Root required mb={4}>
                  <Field.Label>Folder Path</Field.Label>
                  <Input
                    bg="#29374C"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                  />
                </Field.Root>

                {/* File Keyword */}
                <Field.Root mb={4}>
                  <Field.Label>File Keyword</Field.Label>
                  <Input
                    bg="#29374C"
                    placeholder="Optional"
                    value={fileKeyword}
                    onChange={(e) => setFileKeyword(e.target.value)}
                    _placeholder={{color: "gray.400"}}
                  />
                </Field.Root>

                {/* File Type */}
                <Field.Root mb={4}>
                  <Field.Label>File Type</Field.Label>
                  <Input
                    bg="#29374C"
                    placeholder="Optional"
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    _placeholder={{color: "gray.400"}}
                  />
                </Field.Root>

                {/* Source Type */}
                <Field.Root mb={4}>
                  <Field.Label>Source Type</Field.Label>
                  <Input
                    bg="#29374C"
                    placeholder="Optional"
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    _placeholder={{color: "gray.400"}}
                  />
                </Field.Root>

                {/* Interval select (replaces the free-form JSON textarea) */}
                <Field.Root required mb={4}>
                  <Field.Label>Interval</Field.Label>
                  <Select.Root
                    collection={intervalCollection}
                    value={interval ? [interval] : []}
                    onValueChange={(e) => setInterval(e.value[0])}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger bg="#29374C">
                        <Select.ValueText placeholder="Select interval" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.ClearTrigger color="white"/>
                        <Select.Indicator color="white"/>
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {INTERVAL_OPTIONS.map((item) => (
                          <Select.Item key={item.value} item={item} color="black" _hover={{outlineStyle: "solid", outlineColor: "black", outlineWidth: 1}}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>

                {/* Active Switch */}
                <Field.Root display="flex" alignItems="center" mb={4}>
                  <Field.Label mr="auto" mb={0}>Active</Field.Label>
                  <Switch.Root
                    name="active"
                    checked={active}
                    onCheckedChange={({ checked }) => setActive(checked)}
                    mr="auto"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control _checked={{ bg: "green.500" }}>
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
              <Button colorScheme="yellow" type="submit" form="source-form">
                {actionText}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
