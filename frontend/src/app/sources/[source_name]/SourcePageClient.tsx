"use client";

import React, { useMemo, useRef, useState } from 'react';
import { Box, HStack, Heading, IconButton, Text, VStack, Button, Popover, Flex, Separator, Select, Portal, createListCollection, Checkbox, Dialog, Textarea } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import type { Source } from '@/types/source';
import { DotsThreeVertical, PencilSimple, Plus, Trash, Copy } from 'phosphor-react';
import { SourceEditModal, SourceDeleteModal } from '../../components/Modals/SourceModals';
import { MonitoringSensor } from '@/types/sensor';
import { SensorCreateModal, SensorDeleteModal, SensorEditModal, SensorDuplicateModal } from '@/app/components/Modals/SensorModals';
import DataTable from '@/app/components/DataTable';
import { Chart as ChartJS, ChartOptions, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { sensorColumns } from '@/types/columns';
import { Eye } from 'lucide-react';
import { JsonEditor } from 'json-edit-react';
import { toaster } from '@/components/ui/toaster';

ChartJS.register(...registerables);

interface Props {
  initialSource: Source;
  initialSensors: MonitoringSensor[];
}

const chart = createListCollection({
  items: [
    { label: "Latitude", value: "latitude" },
    { label: "Longitude", value: "longitude" },
  ],
})

type NumericField = 'latitude' | 'longitude';

function seedFromString(s: string) {
  // FNV-1a style hash to a 32-bit int
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function colorFromSeed(seed: string, mode: 'light' | 'dark') {
  const h = seedFromString(seed) % 360;
  const s = 65;
  const l = mode === 'light' ? 45 : 70;
  return `hsl(${h} ${s}% ${l}%)`;
}

type SeriesPerSensor = Record<
  string,
  { latitude: number[]; longitude: number[] }
>;

// Utility to format ISO date strings to "Month day, year"
function formatDate(dateString?: string | null) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

const parseConfig = (raw: unknown): Record<string, unknown> | null => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      // unwrap accidental { effectiveConfig: {...} } shapes
      if (parsed && typeof parsed === "object" && "effectiveConfig" in parsed) {
        const inner = parsed.effectiveConfig;
        if (inner && typeof inner === "object") return inner as Record<string, unknown>;
      }
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch { return null; }
  }
  if (typeof raw === "object") {
    // unwrap { effectiveConfig } if present
    if (raw && "effectiveConfig" in raw && typeof raw.effectiveConfig === "object") {
      return raw.effectiveConfig as Record<string, unknown>;
    }
    return raw as Record<string, unknown>;
  }
  return null;
};

export default function SourcePageClient({ initialSource, initialSensors }: Props) {
  const { colorMode } = useColorMode();
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const [source, setSource] = useState<Source>(initialSource);
  const [selectedField, setSelectedField] = useState<NumericField>('latitude');
  const [configViewer, setConfigViewer] = useState<{
    open: boolean;
    data: Record<string, unknown> | null;
    title?: string;
  }>({ open: false, data: null, title: undefined });
  const { labels, perSensor } = useMemo(() => {
    const points = 30;
    const stepMinutes = 2;
    const startTime = new Date(Date.now() - 60 * 60 * 1000);

    // 1) common x-axis
    const labels = Array.from({ length: points }, (_, i) =>
      new Date(startTime.getTime() + i * stepMinutes * 60 * 1000).toLocaleTimeString(
        [],
        { hour: '2-digit', minute: '2-digit' }
      )
    );

    // 2) per-sensor series (seeded random walk around Toronto-ish)
    const baseLat = 43.6532;
    const baseLon = -79.3832;
    const perSensor: SeriesPerSensor = {};

    initialSensors.forEach((s, idx) => {
      const key = String(s.id ?? s.sensor_name ?? idx);
      const rand = mulberry32(seedFromString(key));
      let lat = baseLat + (rand() - 0.5) * 0.1; // up to ~±0.05°
      let lon = baseLon + (rand() - 0.5) * 0.1;

      const latArr: number[] = [];
      const lonArr: number[] = [];
      for (let i = 0; i < points; i++) {
        lat += (rand() - 0.5) * 0.001;
        lon += (rand() - 0.5) * 0.001;
        latArr.push(Number(lat.toFixed(6)));
        lonArr.push(Number(lon.toFixed(6)));
      }
      perSensor[key] = { latitude: latArr, longitude: lonArr };
    });

    return { labels, perSensor };
  }, [initialSensors]);
  const datasets = useMemo(
    () =>
      initialSensors.map((s, idx) => {
        const key = String(s.id ?? s.sensor_name ?? idx);
        const series = perSensor[key];
        const stroke = colorFromSeed(key, colorMode);

        return {
          label: s.sensor_name,
          data: series ? series[selectedField] : [],
          borderColor: stroke,
          backgroundColor:
            colorMode === "dark"
              ? stroke.replace("hsl", "hsla").replace("%)", "% / 0.25)") // soft fill in dark
              : "transparent",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 6,
        };
      }),
    [initialSensors, perSensor, selectedField, colorMode]
  );
  const [sensors, setSensors] = useState<MonitoringSensor[]>(initialSensors);
  const chartRef = useRef<ChartJS<"line">>(null);
  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    const isDark = colorMode === "dark";
    const axisColor  = isDark ? "#E5E7EB" : "#374151";
    const gridColor  = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(100, 100, 100, 0.08)";
    const tooltipBg  = isDark ? "#111827" : "#F9FAFB";
    const tooltipBorder = isDark ? "#4B5563" : "#E5E7EB";

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: "Time", color: axisColor },
          ticks: { color: axisColor },
          grid:  { color: gridColor },
        },
        y: {
          title: {
            display: true,
            text: selectedField === "latitude" ? "Latitude (°)" : "Longitude (°)",
            color: axisColor,
          },
          ticks: { color: axisColor },
          grid:  { color: gridColor },
          beginAtZero: false,
        },
      },
      plugins: {
        legend: {
          display: false,
          labels: { color: axisColor },
        },
        tooltip: {
          enabled: true,
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 1,
          titleColor: axisColor,
          bodyColor: axisColor,
        },
      },
    };
  }, [selectedField, colorMode]);
const [visible, setVisible] = useState<boolean[]>(() =>
  datasets.map(() => true) // start all checked
);

const toggleDataset = (idx: number) => {
  setVisible((prev) => {
    const next = [...prev];
    next[idx] = !next[idx];
    const ci = chartRef.current;
    if (ci) {
      ci.getDatasetMeta(idx).hidden = !next[idx];
      ci.update();
    }
    return next;
  });
};

const toggleAll = (check: boolean) => {
  setVisible(datasets.map(() => check));
  const ci = chartRef.current;
  if (ci) {
    datasets.forEach((_, idx) => {
      ci.getDatasetMeta(idx).hidden = !check;
    });
    ci.update();
  }
};
  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      <Flex mb={4} align="flex-start" position="relative" w="100%" direction="column">
        <Heading fontSize="3xl">  
          <Text as="span" color="purple.600">
            {source.source_name.charAt(0)}
          </Text>
          <Text as="span" fontSize="lg" fontWeight="bold" color="purple.600">
            {source.source_name.slice(1)}
          </Text>
          <Text as="span" ml={2} fontSize="md" fontWeight={"extralight"} color="orange.600">
            {source.details?.project_name || "No Project"}
          </Text>
          <Box
            display="inline-block"
            boxSize="14px"
            borderRadius="full"
            ml="2"
            bg={source.active ? "green.400" : "red.400"}
          />
          <Box display={"inline-block"}>
            <Popover.Root positioning={{ placement: 'right', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
              <Popover.Trigger asChild>
                <IconButton as={DotsThreeVertical} aria-label="More actions" variant="ghost" size="2xs" color="black" borderRadius="full" ml={2}
                  onClick={(e) => e.stopPropagation()}
                  _hover={{
                    backgroundColor: 'blackAlpha.300',
                  }}
                  _dark={{
                    color: "white",
                    _hover: {backgroundColor: "whiteAlpha.200"}
                  }}
                />
              </Popover.Trigger>
              <Popover.Positioner>
                <Popover.Content width="64px" height="100px" borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                  <Popover.Arrow>
                    <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1} _dark={{borderColor: "whiteAlpha.600"}}/>
                  </Popover.Arrow>
                  <Popover.Body height="100px" p={0} >
                    <VStack gap={0} justifyContent={"center"} height="inherit">
                      <SourceEditModal source={source}
                        trigger={
                          <Button variant="ghost" size="md">
                            <PencilSimple />
                          </Button>
                        }
                        onEdited={(edited) => {
                          setSource(edited);
                        }}
                      />
                      <SourceDeleteModal source={source}
                        trigger={
                          <Button variant="ghost" size="md">
                            <Trash />
                          </Button>
                        }
                      />
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          </Box>
        </Heading>
        <Text fontSize="md">
            {source.source_type}
        </Text>
        <Box position="absolute" left={"50%"} transform="translateX(-50%)" textAlign={"center"}>
          <Text fontWeight={"extralight"}>
            {source.folder_path}&nbsp;|&nbsp;{source.file_keyword}&nbsp;|&nbsp;{source.file_type}
          </Text>
          <Text color="blue.600" fontWeight={"bold"}>
            {source.details?.loc_name}
          </Text>
        </Box>
        <Box position="absolute" right="0">
          <Text fontSize="sm">
            Last Updated: {formatDate(source.last_updated)}
          </Text>
          <Text fontSize="sm">
            Config  
            <IconButton
              aria-label={source.config ? "View config" : "No config available"}
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                if (!source.config) return; // no-op if empty
                setConfigViewer({ open: true, data: parseConfig(source.config), title: source.source_name });
              }}
              // optional: visually soften when empty
              opacity={source.config ? 1 : 0.4}
              cursor={source.config ? "pointer" : "not-allowed"}
            >
              <Eye size={16} />
            </IconButton>
          </Text>
        </Box>
      </Flex>
      <Box width="full" className="bg-card">
      <HStack>
        <Box width="full" h="60vh" className="bg-card">
          <Box position="relative" h="full" p={2} pt={14} borderWidth={2} border="none" m={0}>
            <Box className="bg-card" bg="gray.200" _dark={{ bg: 'gray.700' }} position="absolute" right={"2%"} top={3} p={1} m={0}>
              <Select.Root collection={chart} w="150px" value={[selectedField]} 
                onValueChange={(e) => {
                  const next = e.value[0] as NumericField; // <- first selected value
                  if (next) setSelectedField(next);
                }}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger h="25px" minH={0} border={"none"}>
                    <Select.ValueText fontSize={12}/>
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content >
                      {chart.items.map((c) => (
                        <Select.Item item={c} key={c.value}>
                          {c.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Box>
            <Line ref={chartRef} data={{ labels, datasets }} options={chartOptions} />
          </Box>
        </Box>
        <Box minW="15vw" h="60vh" className="bg-card">
          <Box h="100%" overflowY="auto" pb={4}>
            <Heading size="sm" mb={2}>Sensors</Heading>
            <VStack align="start" gap={1}>
              {/* Select All */}
              <HStack gap={2}>
                <Checkbox.Root
                  size="sm"
                  checked={
                    visible.every(Boolean)
                      ? true
                      : visible.every((v) => !v)
                      ? false
                      : "indeterminate"
                  }
                  onCheckedChange={(e) => toggleAll(e.checked === true)}
                  colorPalette="blue"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control cursor="pointer" />
                </Checkbox.Root>
                <Text fontSize="sm">Select All</Text>
              </HStack>

              {/* Individual sensors */}
              {datasets.map((d, idx) => (
                <HStack key={d.label} gap={2}>
                  <Checkbox.Root
                    size="sm"
                    checked={visible[idx]}
                    onCheckedChange={() => toggleDataset(idx)}
                    colorPalette="blue"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control
                      cursor="pointer"
                      borderColor={d.borderColor} // line color as border
                      _checked={{ bg: d.borderColor, borderColor: d.borderColor }}
                    />
                  </Checkbox.Root>
                  <Text fontSize="sm">{d.label}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
          <Dialog.Root open={configViewer.open} onOpenChange={(o) => !o && setConfigViewer(prev => ({ ...prev, open: false }))}>
            <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content maxH="80vh" overflow="hidden" border="2px solid">
                  <Dialog.Header>
                    <Dialog.Title>Config{configViewer.title ? ` — ${configViewer.title}` : ""}</Dialog.Title>
                    <Dialog.CloseTrigger asChild>
                      <IconButton aria-label="Close" variant="ghost" size="xs" />
                    </Dialog.CloseTrigger>
                  </Dialog.Header>
  
                  <Dialog.Body maxH="65vh" overflowY="auto">
                    {configViewer.data ? (
                      <JsonEditor
                        data={configViewer.data}
                        setData={() => { /* read-only viewer */ }}
                        restrictEdit={() => true}     // disallow edits
                        restrictDelete={() => true}   // disallow deletes
                        restrictAdd={() => true}
                        rootName="Config"
                        defaultValue=""
                      />
                    ) : (
                      <Textarea readOnly value="No config available" />
                    )}
                  </Dialog.Body>
  
                  <Dialog.Footer display="flex" gap={2}>
                    <Button
                      variant="surface"
                      onClick={async () => {
                        try {
                          const text = JSON.stringify(configViewer.data ?? {}, null, 2);
                          await navigator.clipboard.writeText(text);
                          toaster.create({ description: "Config copied to clipboard", type: "success" });
                        } catch {
                          toaster.create({
                            description: "Copy failed. Your browser may have blocked clipboard access.",
                            type: "error",
                          });
                        }
                      }}
                    >
                      Copy JSON
                    </Button>
                    <Button onClick={() => setConfigViewer(prev => ({ ...prev, open: false }))}>Close</Button>
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </Box>
      </HStack>
      </Box>
      <Separator variant="solid" size="lg" marginY="6" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'} />
      <DataTable columns={sensorColumns} color={"green.600"} data={sensors} name={"sensors"}
        createElement={
          <SensorCreateModal projectId={source.details?.project_id}
            trigger={
              <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                <Plus /> Add New
              </Button>
            }
            onCreated={(created) => {
              setSensors(prev => [created, ...prev]);
            }}
          />
        }
        editElement={(item) => (
          <SensorEditModal sensor={item}
            trigger={
              <Button variant="ghost" size="md">
                <PencilSimple />
              </Button>
            }
            onEdited={(edited) => {
              setSensors(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
            }}
          />
        )}
        deleteElement={(item) => (
          <SensorDeleteModal sensor={item}
            trigger={
              <Button variant="ghost" size="md">
                <Trash />
              </Button>
            }
            onDeleted={(id) => {
              setSensors(prev => prev.filter(p => p.id !== id));
            }}
          />
        )}
        duplicateElement={(item) => (
          <SensorDuplicateModal sensor={item}
            trigger={
              <Button variant="ghost" size="md">
                <Copy />
              </Button>
            }
            onDuplicated={(duplicated) => {
              setSensors(prev => [duplicated, ...prev]);
            }}
          />
        )}
      />
    </Box>
  );
}
