"use client";

import React, { useMemo, useRef, useState } from 'react';
import { Box, HStack, Heading, IconButton, Table, Text, VStack, Button, Popover, Flex, Separator, Select, Portal, createListCollection, Checkbox } from '@chakra-ui/react';
import { useColorMode, useColorModeValue } from '@/app/src/components/ui/color-mode';
import type { Source } from '@/types/source';
import { DotsThreeVertical, PencilSimple, Trash } from 'phosphor-react';
import { SourceEditModal, SourceDeleteModal } from '../../components/Modals/SourceModals';
import { MonitoringSensor } from '@/types/sensor';
import { SensorCreateModal, SensorDeleteModal, SensorEditModal } from '@/app/components/Modals/SensorModals';
import DataTable from '@/app/components/DataTable';
import { Chart as ChartJS, ChartOptions, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(...registerables);

interface Column {
  key: string;
  label: string;
}

const sensorColumns: Column[] = [
  { key: 'sensor_name', label: 'Sensor Name' },
  { key: 'sensor_type', label: 'Sensor Type' },
  { key: 'details.mon_source_name', label: 'Source' },
  { key: 'sensor_group_id', label: 'Sensor Group' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'sensor data', label: 'Sensor Data'},
  { key: 'active', label: 'Active' },
];

interface Props {
  source: Source;
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
  const l = mode === 'light' ? 45 : 60;
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

export default function SourcePageClient({ source, initialSensors }: Props) {
  const { colorMode } = useColorMode();
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const [isSenCreateOpen, setSenCreateOpen] = useState(false);
  const [isSenEditOpen, setSenEditOpen] = useState(false);
  const [isSenDelOpen, setSenDelOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<MonitoringSensor | undefined>();
  const [senToDelete, setSenToDelete] = useState<MonitoringSensor | undefined>();
  const handleNewSensor = () => { setSelectedSensor(undefined); setSenCreateOpen(true); };
  const handleEditSensor = (s: MonitoringSensor) => { setSelectedSensor(s); setSenEditOpen(true); };
  const handleDeleteSensor = (s: MonitoringSensor) => { setSenToDelete(s); setSenDelOpen(true); };
  const [isSrcEditOpen, setSrcEditOpen] = useState(false);
  const [isSrcDelOpen, setSrcDelOpen] = useState(false);
  const handleEditSource = () => { setSrcEditOpen(true); setPopoverOpen(false) };
  const handleDeleteSource = () => { setSrcDelOpen(true); setPopoverOpen(false) };
  const [selectedField, setSelectedField] = useState<NumericField>('latitude');

  const [isPopoverOpen, setPopoverOpen] = useState(false);
  // scrollbar colors
  const trackBg = useColorModeValue('gray.200', 'gray.700');
  const thumbBg = useColorModeValue('gray.600', 'gray.400');
  const thumbBorder = useColorModeValue('gray.100', 'gray.800');
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
      return {
        label: s.sensor_name,
        data: series ? series[selectedField] : [],
        borderColor: colorFromSeed(key, colorMode), // stable color per sensor
        backgroundColor: 'transparent',
        tension: 0.35,
      };
    }),
  [initialSensors, perSensor, selectedField, colorMode]
);
  const chartRef = useRef<ChartJS<"line">>(null);
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Time' },
        grid:  { display: false },
      },
      y: {
        title: { display: true, text: selectedField === 'latitude' ? 'Latitude (°)' : 'Longitude (°)' },
        beginAtZero: false,
      },
    },
    plugins: {
      legend:  { display: false },
      tooltip: { enabled: true },
    },
  }), [selectedField]);
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
            <Popover.Root positioning={{ placement: 'right', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}} autoFocus={false} open={isPopoverOpen} onOpenChange={() => setPopoverOpen(true)}>
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
                      <Button variant="ghost" size="md" onClick={handleEditSource}>
                        <PencilSimple />
                      </Button>
                      <Button variant="ghost" size="md" onClick={handleDeleteSource}>
                        <Trash />
                      </Button>
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
            Config: {source.config}
          </Text>
        </Box>
      </Flex>
      <HStack>
        <Box width="full" h="60vh" className="bg-card">
          <Box position="relative" h="full" /*"calc(100% - 48px)"*/ p={2} pt={14} borderWidth={2}>
            <Box className="bg-card" bg="gray.200" position="absolute" right={"2%"} top={3} p={1} m={0}>
              <Select.Root collection={chart} w="150px" value={[selectedField]} 
                onValueChange={(e) => {
                  const next = e.value[0] as NumericField; // <- first selected value
                  if (next) setSelectedField(next);
                }}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger h="25px" minH={0}>
                    <Select.ValueText fontSize={12}/>
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
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
          {/* Chart placeholder */}
          {false &&
          <Table.ScrollArea borderWidth={1} borderRadius={"sm"} height="100%" bg="blackAlpha.200" css={{
            /* WebKit (Chrome/Safari) */
            '&::-webkit-scrollbar': {
              width: '8px',
              color: trackBg,
              background: trackBg,
              borderRadius: "xl",
            },
            '&::-webkit-scrollbar-track': {
              background: trackBg,
              borderRadius: '2px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: thumbBg,
              borderRadius: 'xl',
              border: '1px solid',
              borderColor: thumbBorder,
            },
            /* Firefox */
            scrollbarColor: `${thumbBg} ${trackBg}`,
          }}>
            <Table.Root showColumnBorder variant="line" stickyHeader interactive>
              <Table.Header>
                <Table.Row bg="gray.100" _dark={{bg: "gray.700"}} fontSize={16}>
                  <Table.ColumnHeader textAlign={"center"}>
                    Sensor
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign={"center"}>
                    Data
                  </Table.ColumnHeader>
                </Table.Row>   
              </Table.Header>
              <Table.Body>
                {initialSensors.map((sensor) => (
                  <Table.Row key={sensor.id}>
                    <Table.Cell p={3}>
                      {sensor.sensor_name}
                    </Table.Cell>
                    <Table.Cell textAlign={"right"} p={3}>
                      15.6
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
          }
          <Box h="full" overflowY="auto" bg="bg.subtle" borderWidth={1} borderRadius="md" p={2}>
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
        </Box>
      </HStack>
      <Separator variant="solid" size="lg" marginY="6" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'} />
      <DataTable columns={sensorColumns} color={"green.600"} data={initialSensors} onCreate={handleNewSensor} onEdit={handleEditSensor} onDelete={handleDeleteSensor} name={"Sensors"}/>
      <SourceEditModal isOpen={isSrcEditOpen} source={source} onClose={() => { setSrcEditOpen(false); }} />
      <SourceDeleteModal isOpen={isSrcDelOpen} source={source} onClose={() => { setSrcDelOpen(false); }} />
      <SensorCreateModal isOpen={isSenCreateOpen} projectId={source.details?.project_id} onClose={() => { setSelectedSensor(undefined); setSenCreateOpen(false); } } />
      <SensorEditModal isOpen={isSenEditOpen} sensor={selectedSensor} onClose={() => { setSelectedSensor(undefined); setSenEditOpen(false); }} />
      <SensorDeleteModal isOpen={isSenDelOpen} sensor={senToDelete} onClose={() => { setSenToDelete(undefined); setSenDelOpen(false); }} />
    </Box>
  );
}
