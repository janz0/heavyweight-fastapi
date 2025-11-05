// File: app/sources/components/SourceModals.tsx
'use client';

// React + Next Imports
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Chakra Imports + Icons
import { Button, CloseButton, Combobox, createListCollection, Dialog, Field, Flex, HStack, IconButton, Input, Portal, Select, Switch, Textarea } from "@chakra-ui/react";
import { X, Plus } from "lucide-react";
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
import { ProjectCreateModal } from "./ProjectModals";
import { LocationCreateModal } from "./LocationModals";
import { listDistinctRootDirectories } from "@/services/sources";

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

const SOURCE_TYPE_ITEMS = ["IPI-Campbell", "AMTS-DeltaWatch", "AMTS-GeoMoS", "EWS"] as const;
const FILE_TYPE_ITEMS = ["csv"] as const;

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
  const [knownRoots, setKnownRoots] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const roots = await listDistinctRootDirectories(); // or the fallback
        setKnownRoots(roots);
      } catch (e) {
        console.error(e);
        // non-fatal; user can still type a new path
      }
    })();
  }, []);

  const rootsCollection = useMemo(
    () =>
      createListCollection({
        items: knownRoots.map(r => ({ label: r, value: r })),
      }),
    [knownRoots]
  );

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
  const [typedRoot, setTypedRoot] = useState(initialData?.root_directory || "");
  const ignoreEmptyOnBlurRef = React.useRef(false);
  const manualClearRef = React.useRef(false);
  const stripOuterBraces = (s: string) => {
    const t = (s ?? "").trim();
    return t.startsWith("{") && t.endsWith("}") ? t.slice(1, -1).trim() : t;
  };

  const deindentOneLevel = (s: string) =>
  (s ?? "")
    .split("\n")
    .map(line => line.replace(/^(?: {2}|\t)(?!\s*$)/, "")) // don't touch blank lines
    .join("\n");
  const effectiveConfig = useMemo(
    () => ({ ...(interval ? { interval } : {}), ...config,  }),
    [config, interval]
  );
  const [isConfigOpen, setConfigOpen] = useState(false);
  const [configInnerText, setConfigInnerText] = useState(() =>
    deindentOneLevel(stripOuterBraces(JSON.stringify(config, null, 2)))
  );
  const [configError, setConfigError] = useState<string | null>(null);

  const textRef = React.useRef<HTMLTextAreaElement>(null);

  type JsonErrLoc = { line: number; column: number; posInInner: number; message: string } | null;
  const [jsonErrLoc, setJsonErrLoc] = useState<JsonErrLoc>(null);

  // Convert the thrown JSON.parse error into line/col inside the *inner* text
  function locateJsonError(innerText: string, err: unknown): JsonErrLoc {
    const msg = err instanceof Error ? err.message : String(err);

    // Most engines include "... at position N"
    const m = msg.match(/position\s+(\d+)/i);
    if (!m) return { line: 1, column: 1, posInInner: 0, message: msg };

    const absolutePos = Number(m[1]); // in the *full* string we parse
    // You build `full` as `{\n${inner}\n}` (or `{}` when empty)
    // So the inner text starts at offset 2 characters: "{\n"
    const INNER_OFFSET = 2;

    // If inner is empty, the error likely points at the closing brace; clamp to zero
    const posInInner = Math.max(0, absolutePos - INNER_OFFSET);

    // Compute line/column inside the inner text
    const before = innerText.slice(0, posInInner);
    const lines = before.split("\n");
    const line = lines.length;            // 1-based
    const column = (lines[lines.length - 1] || "").length + 1; // 1-based

    return { line, column, posInInner, message: msg };
  }

  const validateInner = (innerText: string) => {
    const inner = stripOuterBraces(innerText);
    const full = inner ? `{\n${inner}\n}` : "{}";
    try {
      const parsed = JSON.parse(full);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false as const, message: "Config must be a JSON object" };
      }
      const next = Object.fromEntries(
        Object.entries(parsed).filter(([k]) => k !== "interval" && k !== "id")
      );
      return { ok: true as const, next };
    } catch (e) {
      const loc = locateJsonError(inner, e);
      setJsonErrLoc(loc);
      return { ok: false as const, message: e instanceof Error ? e.message : "Invalid JSON" };
    }
  };
  
  const applyConfigInnerText = () => {
    const res = validateInner(configInnerText);
    if (res.ok) {
      setConfig(res.next);
      setConfigError(null);
      setConfigInnerText(
        deindentOneLevel(stripOuterBraces(JSON.stringify(res.next, null, 2)))
      );
    } else {
      setConfigError(res.message);
    }
  };
  const openFullscreen = () => {
    const res = validateInner(configInnerText);
    if (res.ok) {
      setConfig(res.next);
      setConfigError(null);
      setConfigOpen(true);
    } else {
      setConfigError(res.message);
      toaster.create({
        description: jsonErrLoc
          ? `Cannot open editor: Invalid JSON - Line ${jsonErrLoc.line} ` //, Col ${jsonErrLoc.column}
          : `Cannot open editor: ${res.message}`,
        type: "error",
      });
    }
  };
  useEffect(() => {
    setConfigInnerText(
      deindentOneLevel(stripOuterBraces(JSON.stringify(config, null, 2)))
    );
  }, [config]);


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

  // When jsonErrLoc changes, select the whole line in the textarea
  useEffect(() => {
    if (!jsonErrLoc || !textRef.current) return;

    const el = textRef.current;
    const value = el.value;
    const { posInInner } = jsonErrLoc;

    let lineStart = value.lastIndexOf("\n", Math.max(0, posInInner - 1)) + 1;
    if (lineStart < 0) lineStart = 0;

    let lineEnd = value.indexOf("\n", posInInner);
    if (lineEnd === -1) lineEnd = value.length;

    const firstNonRel = value.slice(lineStart, lineEnd).search(/[^\t ]/);
    const firstNon = firstNonRel === -1 ? lineStart : lineStart + firstNonRel;

    let lastNon = lineEnd - 1;
    while (lastNon >= lineStart && (value[lastNon] === ' ' || value[lastNon] === '\t')) {
      lastNon--;
    }
    const hasContent = lastNon >= firstNon;

    const start = hasContent ? firstNon : posInInner;
    const end   = hasContent ? lastNon + 1 : Math.min(posInInner + 1, value.length);

    el.focus();
    el.setSelectionRange(start, end);
  }, [jsonErrLoc]);

  const sourceTypesCollection = useMemo(
    () => createListCollection({ items: SOURCE_TYPE_ITEMS }),
    []
  );
  
  const fileTypesCollection = useMemo(
    () => createListCollection({ items: FILE_TYPE_ITEMS }),
    []
  );

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

  const [isCreateProjectOpen, setCreateProjectOpen] = useState(false);
  const handleNewProject = () => { setCreateProjectOpen(true); };

  const [isCreateLocationOpen, setCreateLocationOpen] = useState(false);
  const handleNewLocation = () => { setCreateLocationOpen(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = validateInner(configInnerText);
    if (!res.ok) {
      setConfigError(res.message);
      toaster.create({ description: `Fix config: ${res.message}`, type: "error" });
      return;
    }
    setConfig(res.next); // ensure synced
    const payload: SourcePayload = {
      mon_loc_id:    locationIds[0] || "",
      source_name:   sourceName,
      folder_path:   folderPath,
      file_keyword:  fileKeyword,
      file_type:     fileType,
      source_type:   sourceType,
      config:        JSON.stringify( effectiveConfig ),
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
    <>
      <form id="source-form" onSubmit={handleSubmit}>
        {/* Project */}
        <HStack>
          <Field.Root required mb={4}>
            <Field.Label>Project</Field.Label>
            <Select.Root
              collection={projectCollection}
              value={projectIds}
              onValueChange={e => setProjectIds(e.value)}
              disabled={isProjectLocked}
              rounded="sm"
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
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
                <Select.Content
                  mt="-1px"
                  borderWidth="1px"
                  borderColor={bc}
                  rounded="sm"
                  shadow="md"
                  overflowY="auto"
                  w="100%">
                  {projectCollection.items.map(item => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>
          <IconButton mt="auto" mb={4} aria-label="New Project" outline="solid thin" variant="ghost" onClick={handleNewProject}>
            <Plus />
          </IconButton>
        </HStack>

        {/* Location */}
        <HStack>
          <Field.Root required mb={4}>
            <Field.Label>Location</Field.Label>
            <Select.Root
              collection={locationCollection}
              value={locationIds}
              onValueChange={e => setLocationIds(e.value)}
              disabled={isLocationLocked || !projectIds[0]}
              rounded="sm"
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
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
                <Select.Content
                  mt="-1px"
                  borderWidth="1px"
                  borderColor={bc}
                  rounded="sm"
                  shadow="md"
                  overflowY="auto"
                  w="100%"
                >
                  {locationCollection.items.map(item => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>
          <IconButton mt="auto" mb={4} aria-label="New Location" outline="solid thin" variant="ghost" onClick={() => {
              if (!projectIds[0]) {
                toaster.create({ description: "Select a project first", type: "info" });
                return;
              }
              handleNewLocation();
            }}
            disabled={!projectIds[0] || isLocationLocked}
            title={
              !projectIds[0]
                ? "Select a project first"
                : isLocationLocked
                ? "Location is locked for this source"
                : "New location"
            }
            >
            <Plus />
          </IconButton>
        </HStack>

        {/* Other fields */}
        <Field.Root required mb={4}>
          <Field.Label>Source Name</Field.Label>
          <Input value={sourceName} borderColor={bc} onChange={e => setSourceName(e.target.value)} _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
          }}/>
        </Field.Root>

        <Field.Root required mb={4}>
          <Field.Label >Folder Path</Field.Label>
          <Input value={folderPath} borderColor={bc} onChange={e => setFolderPath(e.target.value)}
          _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
          }}/>
        </Field.Root>

        <Field.Root required mb={4}>
          <Field.Label>Root Directory</Field.Label>
          <Combobox.Root
            collection={rootsCollection}
            inputValue={typedRoot}
            onInputValueChange={({ inputValue }) => {
              if (inputValue === "" && ignoreEmptyOnBlurRef.current) return;
              setTypedRoot(inputValue);
            }}
            value={knownRoots.includes(rootDirectory) ? [rootDirectory] : []}
            onValueChange={(e) => {
              const v = e.value[0] ?? "";
              setRootDir(v);
              setTypedRoot(v);
            }}
            openOnClick
            positioning={{ sameWidth: true, gutter: 0 }}
          >
            <Combobox.Control 
              h="2.5rem"
              minH="unset"
              borderWidth="1px"
              borderColor={bc}
              rounded="sm"
              display="flex"
              _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
              }}
            >
              <Combobox.Input
                placeholder="Type or select a root dir (e.g. /mnt/data)"
                flex="1"
                h="100%"
                w="100%"
                minH="unset"
                px="2"
                border="none"
                _focus={{ outline: "none" }}
                onBlur={() => {
                  const v = typedRoot.trim();
                  if (v) setRootDir(v);       // commit free text on blur
                  ignoreEmptyOnBlurRef.current = true; // ignore the next "" change
                  // clear the guard on the next tick
                  setTimeout(() => { ignoreEmptyOnBlurRef.current = false; }, 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = typedRoot.trim();
                    if (v && !knownRoots.includes(v)) {
                      setRootDir(v);
                    }
                  }
                }}
              />
              <Combobox.IndicatorGroup>
                {typedRoot && (
                  <Combobox.ClearTrigger
                    onClick={() => {
                      manualClearRef.current = true;
                      setRootDir("");
                      setTypedRoot("");
                    }}
                  />
                )}
                
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Combobox.Positioner>
              <Combobox.Content
                mt="7px"
                borderWidth="1px"
                borderColor={bc}
                rounded="sm"
                shadow="md"
                overflowY="auto"
                w="100%"
              >
                {rootsCollection.items.map((item) => (
                  <Combobox.Item key={item.value} item={item}>
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox.Root>
        </Field.Root>

        <Field.Root mb={4}>
          <Field.Label>File Keyword</Field.Label>
          <Input
            placeholder="Optional"
            value={fileKeyword}
            borderColor={bc}
            onChange={e => setFileKeyword(e.target.value)}
            _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
            }}
          />
        </Field.Root>

        <Field.Root mb={4}>
          <Field.Label>File Type</Field.Label>
          <Select.Root
            collection={fileTypesCollection}
            value={fileType ? [fileType] : []}
            onValueChange={e => setFileType(e.value[0] ?? "")}
            rounded="sm"
            _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
          }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger borderColor={bc}>
                <Select.ValueText
                  placeholder="Optional"
                />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.ClearTrigger />
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content
                mt="-1px"
                borderWidth="1px"
                borderColor={bc}
                rounded="sm"
                shadow="md"
                overflowY="auto"
                w="100%"
              >
                {fileTypesCollection.items.map((item) => (
                  <Select.Item key={item} item={item}>
                    {item}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Field.Root>

        <Field.Root mb={4}>
          <Field.Label>Source Type</Field.Label>
          <Select.Root
            collection={sourceTypesCollection}
            value={sourceType ? [sourceType] : []}
            onValueChange={e => setSourceType(e.value[0] ?? "")}
            rounded="sm"
            _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
          }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger borderColor={bc}>
                <Select.ValueText
                  placeholder="Optional"
                />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.ClearTrigger />
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content
                mt="-1px"
                borderWidth="1px"
                borderColor={bc}
                rounded="sm"
                shadow="md"
                overflowY="auto"
                w="100%"
              >
                {sourceTypesCollection.items.map((item) => (
                  <Select.Item key={item} item={item}>
                    {item}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Field.Root>
        <Field.Root mb={4}>
          <Field.Label>Config</Field.Label>
          <Flex align="center" gap={2} position="relative" w="100%" rounded="sm" _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
          }}>
            <Textarea
              ref={textRef}
              className={`config-textarea ${jsonErrLoc ? 'has-error' : ''}`}
              borderColor={jsonErrLoc ? 'red.400' : bc}
              w="100%"
              placeholder={`"sn_map": {
    "x1": "IPI-N05-05",
    "x2": "IPI-N11-12",
    "x3": "IPI-N02-05",
    "x4": "IPI-N11-04",
    "x5": "IPI-N08-03"
  },
  "notes": "",
  "threshold": 5`}
              minH="120px"
              fontFamily="mono"
              value={configInnerText}
              onChange={(e) => {
                setConfigInnerText(stripOuterBraces(e.target.value));
                if (configError) setConfigError(null);
                if (jsonErrLoc) setJsonErrLoc(null); // clear error highlight on edit
              }}
              onBlur={applyConfigInnerText}
            />
            {jsonErrLoc && (
              <style jsx global>{`
                /* Customize selection highlight when the textarea has an error */
                .config-textarea.has-error::selection {
                  background: var(--chakra-colors-red-600);
                  color: white;
                }
                /* Some browsers (Firefox) also support ::-moz-selection */
                .config-textarea.has-error::-moz-selection {
                  background: var(--chakra-colors-red-600);
                  color: white;
                }
              `}</style>
            )}
            {(configError || jsonErrLoc) && (
              <Field.ErrorText>
                {jsonErrLoc
                  ? `Invalid JSON at line ${jsonErrLoc.line}, column ${jsonErrLoc.column}: ${configError ?? "Syntax error"}`
                  : configError}
              </Field.ErrorText>
            )}
            <IconButton
              position="absolute"
              right="4"
              top="0"
              aria-label="Fullscreen editor"
              size="2xs"
              bg="transparent"
              color="bg.inverted"
            ><Maximize2 size="sm" onClick={openFullscreen}></Maximize2></IconButton>
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
            rounded="sm"
            _focusWithin={{
                outline: "2px solid",
                outlineColor: "var(--chakra-colors-blue-400)",
                outlineOffset: "2px",
          }}
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
              <Select.Content
                mt="-1px"
                borderWidth="1px"
                borderColor={bc}
                rounded="sm"
                shadow="md"
                overflowY="auto"
                w="100%"
              >
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
      <ProjectCreateModal isOpen={isCreateProjectOpen} onClose={() => { setCreateProjectOpen(false);}} />
      <LocationCreateModal projectId={projectIds[0]} isOpen={isCreateLocationOpen} onClose={() => { setCreateLocationOpen(false);}} />
    </>
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
