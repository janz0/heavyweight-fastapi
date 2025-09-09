// File: app/sources/components/SourceModals.tsx
'use client';

// React + Next Imports
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Chakra Imports + Icons
import { Button, CloseButton, createListCollection, Dialog, Field, Flex, IconButton, Input, Portal, Select, Switch, Textarea } from "@chakra-ui/react";
import { X } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";
import { Maximize2 } from "lucide-react";

import { JsonEditor } from 'json-edit-react';
import type { FilterFunction } from 'json-edit-react';

// Services + Types
import { createSource, updateSource, deleteSource} from "@/services/sources";
import { listProjects } from "@/services/projects";
import { listLocations } from "@/services/locations";
import type { Source, SourcePayload } from "@/types/source";
import type { Project } from "@/types/project";
import type { Location } from "@/types/location";

const INTERVAL_OPTIONS = [
  { label: "5 minutes",  value: "5min"  },
  { label: "10 minutes", value: "10min" },
  { label: "15 minutes", value: "15min" },
  { label: "30 minutes", value: "30min" },
  { label: "1 hour", value: "1hr" },
  { label: "3 hours", value: "3hr" },
  { label: "6 hours", value: "6hr" },
  { label: "12 hours", value: "12hr" },
  { label: "24 hours", value: "24hr" },
  { label: "48 hours", value: "48hr" },
];

// ----------------------
// Shared form component
// ----------------------
function SourceForm({
  onSubmit,
  onClose,
  initialData,
  initialProjectId,
  submitLabel,
}: {
  onSubmit: (payload: SourcePayload) => Promise<void>;
  onClose(): void;
  initialData?: Source;
  initialProjectId?: string;
  submitLabel: string;
}) {
  const { colorMode } = useColorMode();
  const bc = colorMode === "light" ? "black" : "white";
  const fixedProjectId = initialProjectId ?? initialData?.details?.project_id;
  const isProjectLocked = Boolean(fixedProjectId);
  const fixedLocationId = initialData?.mon_loc_id;
  const isLocationLocked = Boolean(fixedLocationId);

  const router = useRouter();
  const editMode = Boolean(initialData);

  // form fields
  const [projects, setProjects]     = useState<Project[]>([]);
  const [locations, setLocations]   = useState<Location[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>(
    fixedProjectId ? [fixedProjectId] : []
  );

  const [locationIds, setLocationIds] = useState<string[]>(
    isLocationLocked ? [fixedLocationId!] : []
  );
  const [sourceName,  setSourceName]  = useState(initialData?.source_name  || "");
  const [folderPath,  setFolderPath]  = useState(initialData?.folder_path  || "");
  const [fileKeyword, setFileKeyword] = useState(initialData?.file_keyword || "");
  const [fileType,    setFileType]    = useState(initialData?.file_type    || "");
  const [sourceType,  setSourceType]  = useState(initialData?.source_type  || "");
  const [interval, setInterval] = useState<string>(() => {
    if (!initialData) return "";
    try {
      const cfg = typeof initialData.config === "string"
        ? JSON.parse(initialData.config)
        : (initialData.config as { interval?: string });
      return cfg.interval ?? "";
    } catch { return ""; }
  });

  
  // keep config WITHOUT interval
  const [config, setConfig] = useState<Record<string, unknown>>(() => {
    if (!initialData?.config) return {};
    try {
      const full = typeof initialData.config === "string"
        ? JSON.parse(initialData.config)
        : initialData.config;

      // remove "interval" without creating an unused binding
      return Object.fromEntries(
        Object.entries((full ?? {}) as Record<string, unknown>)
          .filter(([k]) => k !== "interval")
      );
    } catch {
      return {};
    }
  });
  const [active, setActive] = useState(initialData ? initialData.active === 1 : true);
  const [rootDirectory, setRootDir] = useState(initialData?.root_directory || "");

  const effectiveConfig = useMemo(
    () => ({ ...(interval ? { interval } : {}), ...config,  }),
    [config, interval]
  );
  const [isConfigOpen, setConfigOpen] = useState(false);

  const LOCK_KEYS = new Set(['id', 'interval']);

  const lockRootAndKeys: FilterFunction = ({ level, key }) =>
    level === 0 || (typeof key === 'string' && LOCK_KEYS.has(key));

  // load projects
  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(err => {
        console.error(err);
        toaster.create({ description: "Could not load projects", type: "error" });
      });
  }, []);

  // build project select collection
  const projectCollection = useMemo(
    () => createListCollection({
      items: projects.map(p => ({
        label: p.project_name,
        value: p.id
      }))
    }),
    [projects]
  );

  // when project changes, reload locations
  useEffect(() => {
    if (projectIds[0]) {
      listLocations(projectIds[0])
        .then(setLocations)
        .catch(err => {
          console.error(err);
          toaster.create({ description: "Could not load locations", type: "error" });
        });
    } else {
      Promise.all(projects.map(p => listLocations(p.id)))
        .then(arrays => setLocations(arrays.flat()))
        .catch(err => {
          console.error(err);
          toaster.create({ description: "Could not load locations", type: "error" });
        });
    }
  }, [projectIds, projects]);

  const locationCollection = useMemo(
    () => createListCollection({
      items: locations.map(l => ({
        label: l.loc_name,
        value: l.id
      }))
    }),
    [locations]
  );

  const intervalCollection = useMemo(
    () => createListCollection({
      items: INTERVAL_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value
      }))
    }),
    []
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: SourcePayload = {
      mon_loc_id:    locationIds[0] || "",
      source_name:   sourceName,
      folder_path:   folderPath,
      file_keyword:  fileKeyword,
      file_type:     fileType,
      source_type:   sourceType,
      config:        JSON.stringify({ effectiveConfig }),
      active:        active ? 1 : 0,
      root_directory: rootDirectory,
    };

    try {
      await onSubmit(payload);
      onClose();
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : String(err); // fallback for non-Error throws
      toaster.create({
        description: `${editMode ? "Update" : "Create"} failed: ${message}`,
        type: "error",
      });
    }
  }

  // if initialData changes, re-populate fields
  useEffect(() => {
    if (!initialData) return;
    setProjectIds(initialData.details ? [initialData.details.project_id] : []);
    setLocationIds([initialData.mon_loc_id]);
    setSourceName(initialData.source_name);
    setFolderPath(initialData.folder_path);
    setFileKeyword(initialData.file_keyword);
    setFileType(initialData.file_type);
    setSourceType(initialData.source_type);

    try {
      const full = typeof initialData.config === "string"
        ? JSON.parse(initialData.config)
        : (initialData.config as Record<string, unknown>);
      const { interval: cfgInterval, ...rest } = full ?? {};
      setInterval((cfgInterval as string) ?? "");
      setConfig(rest as Record<string, unknown>);
    } catch {
      setInterval("");
      setConfig({});
    }
    setActive(initialData.active === 1);
    setRootDir(initialData.root_directory);
  }, [initialData]);
  const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  return (
    <form id="source-form" onSubmit={handleSubmit}>
      {/* Project */}
      <Field.Root required mb={4}>
        <Field.Label>Project</Field.Label>
        <Select.Root
          collection={projectCollection}
          value={projectIds}
          onValueChange={e => setProjectIds(e.value)}
          disabled={isProjectLocked}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger borderColor={bc}>
              <Select.ValueText placeholder="Select project" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              {!isProjectLocked && <Select.ClearTrigger />}
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {projectCollection.items.map(item => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Field.Root>

      {/* Location */}
      <Field.Root required mb={4}>
        <Field.Label>Location</Field.Label>
        <Select.Root
          collection={locationCollection}
          value={locationIds}
          onValueChange={e => setLocationIds(e.value)}
          disabled={isLocationLocked || !projectIds[0]}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger borderColor={bc}>
              <Select.ValueText
                placeholder={
                  !projectIds[0] ? "Select a project first" : "Select location"
                }
              />
            </Select.Trigger>
            <Select.IndicatorGroup>
              {!isLocationLocked && <Select.ClearTrigger />}
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {locationCollection.items.map(item => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Field.Root>

      {/* Other fields */}
      <Field.Root required mb={4}>
        <Field.Label>Source Name</Field.Label>
        <Input value={sourceName} borderColor={bc} onChange={e => setSourceName(e.target.value)} />
      </Field.Root>

      <Field.Root required mb={4}>
        <Field.Label>Folder Path</Field.Label>
        <Input value={folderPath} borderColor={bc} onChange={e => setFolderPath(e.target.value)} />
      </Field.Root>

      <Field.Root required mb={4}>
        <Field.Label>Root Directory</Field.Label>
        <Input value={rootDirectory} borderColor={bc} onChange={e => setRootDir(e.target.value)} />
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label>File Keyword</Field.Label>
        <Input
          placeholder="Optional"
          value={fileKeyword}
          borderColor={bc}
          onChange={e => setFileKeyword(e.target.value)}
        />
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label>File Type</Field.Label>
        <Input
          placeholder="Optional"
          value={fileType}
          borderColor={bc}
          onChange={e => setFileType(e.target.value)}
        />
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label>Source Type</Field.Label>
        <Input
          placeholder="Optional"
          value={sourceType}
          borderColor={bc}
          onChange={e => setSourceType(e.target.value)}
        />
      </Field.Root>
      <Field.Root mb={4}>
        <Field.Label>Config</Field.Label>
        <Flex align="center" gap={2} position="relative" w="100%">
          <Textarea
            borderColor={bc}
            w="100%"
            placeholder='{"interval":"5min"}'
            minH="120px"
            fontFamily="mono"
            value={JSON.stringify(effectiveConfig, null, 2)}
            readOnly
          />
          <IconButton
            position="absolute"
            right="4"
            top="0"
            aria-label="Fullscreen editor"
            size="2xs"
            bg="transparent"
            color="bg.inverted"
          ><Maximize2 size="sm" onClick={() => setConfigOpen(true)}></Maximize2></IconButton>
        </Flex>

        {/* Fullscreen editor */}
        <Dialog.Root open={isConfigOpen} onOpenChange={() => setConfigOpen(false)}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="30vw" maxH="80vh">
                <Dialog.Header>
                  <Dialog.CloseTrigger asChild>
                    <IconButton aria-label="Close" variant="ghost" onClick={() => setConfigOpen(false)}>
                      <X size={16} />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body maxH="100vh" w="100%" overflowY="auto">
                  <JsonEditor
                    data={effectiveConfig}
                    setData={(data) => {
                      // accept `unknown` as required by the lib, then narrow:
                      if (!isPlainObject(data)) {
                        setConfig({});
                        return;
                      }
                      // keep everything except "interval" (which is controlled by the select)
                      const rest = Object.fromEntries(
                        Object.entries(data).filter(([k]) => k !== "interval")
                      );
                      setConfig(rest);
                    }}
                    restrictEdit={lockRootAndKeys}
                    restrictDelete={lockRootAndKeys}
                    rootName="Config"
                    defaultValue=""
                  />
                </Dialog.Body>
                <Dialog.Footer>
                  <Button onClick={() => setConfigOpen(false)}>Save</Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Field.Root>
      <Field.Root required mb={4}>
        <Field.Label>Interval</Field.Label>
        <Select.Root
          collection={intervalCollection}
          value={interval ? [interval] : []}
          onValueChange={e => setInterval(e.value[0])}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger borderColor={bc} >
              <Select.ValueText placeholder="Select interval" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.ClearTrigger />
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {INTERVAL_OPTIONS.map(opt => (
                <Select.Item key={opt.value} item={opt}>
                  {opt.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Field.Root>

      <Field.Root justifyItems={"center"}>
        <Flex gap="2">
        <Field.Label>Active</Field.Label>
        <Switch.Root
          checked={active}
          onCheckedChange={({ checked }) => setActive(checked)}
        >
          <Switch.HiddenInput />
          <Switch.Control _checked={{ bg: 'green.400' }}>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
        </Flex>
      </Field.Root>

      <Dialog.Footer>
        <Button mr={3} type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {submitLabel}
        </Button>
      </Dialog.Footer>
    </form>
  );
}

// ----------------------
// CreateSourceModal
// ----------------------
export function SourceCreateModal({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}) {
  const handleCreate = async (payload: SourcePayload) => {
    await createSource(payload);
    toaster.create({ description: "Source created", type: "success" });
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid" maxH="80vh">
            <Dialog.Header>
              <Dialog.Title>Create Source</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto">
              <SourceForm
                onSubmit={handleCreate}
                onClose={onClose}
                submitLabel="Create"
                initialProjectId={projectId}
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ----------------------
// EditSourceModal
// ----------------------
export function SourceEditModal({
  isOpen,
  onClose,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  source?: Source;
}) {
  const handleUpdate = async (payload: SourcePayload) => {
    if (!source) return;
    await updateSource(String(source.id), payload);
    toaster.create({ description: "Source updated", type: "success" });
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid" maxH="80vh">
            <Dialog.Header>
              <Dialog.Title>Edit Source</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto">
              <SourceForm
                onSubmit={handleUpdate}
                onClose={onClose}
                initialData={source}
                submitLabel="Save"
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ----------------------
// DeleteSourceModal
// ----------------------
export function SourceDeleteModal({
  isOpen,
  onClose,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  source?: Source;
}) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleDelete = async () => {
    if (!source) return;
    await deleteSource(String(source.id));
    toaster.create({ description: "Source deleted", type: "success" });
    onClose();

    // if on detail page, go back, otherwise refresh
    const detailRoute = /^\/sources\/[^\/]+$/;
    if (detailRoute.test(pathname)) {
      router.back();
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()} size="sm">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid" maxH="80vh">
            <Dialog.Header>
              <Dialog.Title>Delete Source</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete <strong>{source?.source_name}</strong>?
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose}>Cancel</Button>
              <Button onClick={handleDelete}>Delete</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ----------------------
// DuplicateSourceModal
// ----------------------
export function SourceDuplicateModal({
  isOpen,
  onClose,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  source?: Source;
}) {
  const handleDuplicate = async (payload: SourcePayload) => {
    await createSource(payload); // same service as create
    toaster.create({ description: "Source duplicated", type: "success" });
    onClose();
  };

  // Strip out id and source_name before passing down
  const cloneData: Omit<Source, "id"> | undefined = source
    ? {
        ...source,
        source_name: "", // clear name
      }
    : undefined;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop onClick={onClose} />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid" maxH="80vh">
            <Dialog.Header>
              <Dialog.Title>Duplicate Source</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto">
              <SourceForm
                onSubmit={handleDuplicate}
                onClose={onClose}
                initialData={cloneData as Source}
                submitLabel="Create"
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
