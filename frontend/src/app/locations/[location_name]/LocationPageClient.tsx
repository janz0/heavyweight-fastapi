"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import React, { useMemo, useState } from 'react';
import { Box, HStack, Heading, Text, VStack, Button, Tabs, Popover, Flex, Table, IconButton, Link, Separator } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import type { Location } from '@/types/location';
import type { MonitoringSensor } from '@/types/sensor';
import type { Source } from '@/types/source';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { PencilSimple, Trash, DotsThreeVertical } from "phosphor-react";
import DataTable from '@/app/components/DataTable';
import SearchInput from '@/app/components/SearchInput';
import PageSizeSelect from '@/app/components/PageSizeSelect';
import { Line } from "react-chartjs-2";
import { SourceCreateModal, SourceEditModal, SourceDeleteModal } from '@/app/sources/components/SourceModals';
import { SensorCreateModal, SensorEditModal, SensorDeleteModal } from '@/app/sensors/components/SensorModals';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationPageClientProps {
  location: Location;
  initialSources: Source[];
  initialSensors: MonitoringSensor[];
}

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

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

interface Column {
  key: string;
  label: string;
}

const sourcesColumns: Column[] = [
  { key: "source_name", label: "Source Name" },
  { key: "details.loc_name", label: "Location" },
  { key: "folder_path", label: "Folder Path" },
  { key: "file_keyword", label: "File Keyword" },
  { key: "file_type", label: "File Type" },
  { key: "source_type", label: "Source Type" },
  { key: "config", label: "Config" },
  { key: "last_updated", label: "Last Data Upload" },
  { key: "active", label: "Status" },
];

const sensorColumns: Column[] = [
  { key: 'sensor_name', label: 'Sensor Name' },
  { key: 'sensor_type', label: 'Sensor Type' },
  { key: 'mon_source_id', label: 'Source' },
  { key: 'sensor_group_id', label: 'Sensor Group' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'sensor data', label: 'Sensor Data'},
  { key: 'active', label: 'Active' },
];

export default function LocationPageClient({ location, initialSources, initialSensors }: LocationPageClientProps) {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const text = colorMode === "light" ? "gray.800" : "gray.200";
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const cardBg  = colorMode === 'light' ? 'white'    : 'gray.700';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';
  const [activeTab, setActiveTab] = useState<'sources'|'sensors'>('sources');
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc"|"desc" }|null>(null);

  const pageSizeOptions = [10, 25, 50, 100];

  // Source Variables
    const [isSrcCreateOpen, setSrcCreateOpen] = useState(false);
    const [isSrcEditOpen, setSrcEditOpen] = useState(false);
    const [isSrcDelOpen, setSrcDelOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Source | undefined>();
    const [srcToDelete, setSrcToDelete] = useState<Source | undefined>();
    const handleNewSource = () => { setSelectedSource(undefined); setSrcCreateOpen(true); };
    const handleEditSource = (s: Source) => { setSelectedSource(s); setSrcEditOpen(true); };
    const handleDeleteSource = (s: Source) => { setSrcToDelete(s); setSrcDelOpen(true); };
  
    // Sensor Variables
    const [isSenCreateOpen, setSenCreateOpen] = useState(false);
    const [isSenEditOpen, setSenEditOpen] = useState(false);
    const [isSenDelOpen, setSenDelOpen] = useState(false);
    const [selectedSensor, setSelectedSensor] = useState<MonitoringSensor | undefined>();
    const [senToDelete, setSenToDelete] = useState<MonitoringSensor | undefined>();
    const handleNewSensor = () => { setSelectedSensor(undefined); setSenCreateOpen(true); };
    const handleEditSensor = (s: MonitoringSensor) => { setSelectedSensor(s); setSenEditOpen(true); };
    const handleDeleteSensor = (s: MonitoringSensor) => { setSenToDelete(s); setSenDelOpen(true); };
    const readings: string[] = [];
  
  const items = useMemo(() => {
    switch (activeTab) {
      case 'sources':   return initialSources;
      case 'sensors':   return initialSensors;
      default:          return [];
    }
  }, [activeTab, initialSources, initialSensors]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      // pick the right “name” field per type:
      let value = '';
      if (activeTab === 'sources')    value = (item as Source).source_name;
      if (activeTab === 'sensors')    value = (item as MonitoringSensor).sensor_name;
      return value.toLowerCase().includes(q);
    });
  }, [items, search, activeTab]);
  
  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const { key, direction } = sortConfig;
    return [...filtered].sort((a, b) => {
      const av = getNestedValue(a, key), bv = getNestedValue(b, key);
      if (av == null || bv == null) return av == null ? -1 : 1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return direction === 'asc' ? av - bv : bv - av;
      }
      return direction === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const displayed  = sorted.slice((page - 1) * pageSize, page * pageSize);

  function formatDate(dateString?: string | null) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day:   'numeric',
      year:  'numeric',
    }).format(date);
  }
  const requestSort = (key: string) => {
    setSortConfig(sc =>
      sc?.key===key && sc.direction==="asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" }
    );
  };
  return (
    <Box minH="100vh" p={6} bg={bg}>
      <Breadcrumb
        crumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Projects', href: '/projects' },
        ]}
      />
      <Box w="100%" gap="4" mb="4">
        {/* Metrics */}
        <Box mb={3} border="inset" borderRadius="xl" p="12px" h="full" alignItems="center" justifyItems={"center"}>
          {/* Title */}
            <Heading size="3xl">{location.loc_name}</Heading>
        </Box>
      </Box>
      <HStack mb={3} h="50vh" align="stretch">
        <VStack w="40%" h="fit-content">
          <Box border="inset" borderRadius="xl" p="12px" w="100%">
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Project Name:</Text>
              <Text fontWeight="medium">{location.details?.project_name||"N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Location Number:</Text>
              <Text fontWeight="medium">{location.loc_number||"N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Latitude:</Text>
              <Text fontWeight="medium">{location.lat}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Longitude:</Text>
              <Text fontWeight="medium">{location.lon}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Status:</Text>
              <Text fontWeight="medium">(Placeholder)</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Created At:</Text>
              <Text fontWeight="medium">{formatDate(location.created_at)}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Updated:</Text>
              <Text fontWeight="medium">{formatDate(location.last_updated)}</Text>
            </HStack>
          </Box>
          <Box border="inset" borderRadius="xl" p="12px" w="100%">
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Inspected:</Text>
              <Text fontWeight="medium">{location.last_inspected? formatDate(location.last_inspected) : "N/A"}</Text>
            </HStack>
          </Box>
          <Button
            variant='solid'
            borderWidth={"2px"}
            borderColor={"black"}
            borderRadius={"xl"}
            border="inset"
            _dark={{borderColor: "white"}}
            w="100%"
            fontSize={"xl"}
          >
            Inspection Checklist
          </Button>
          {
          <HStack w="100%" gap="4">
            <Button
              variant={activeTab === 'sources' ? 'solid' : 'ghost'}
              flex="1"
              borderWidth={"2px"}
              borderColor={"black"}
              borderRadius={"xl"}
              border="inset"
              _dark={{borderColor: "white"}}
              fontSize={"xl"}
              onClick={() => setActiveTab("sources")}
            >
              Sources
            </Button>
            <Button
              variant={activeTab === 'sensors' ? 'solid' : 'ghost'}
              flex="1"
              borderWidth={"2px"}
              borderColor={"black"}
              borderRadius={"xl"}
              border="inset"
              _dark={{borderColor: "white"}}
              fontSize={"xl"}
              onClick={() => setActiveTab("sensors")}
            >
              Sensors
            </Button>
          </HStack>
          }
        </VStack>
        {/* Map View */}
        <Tabs.Root defaultValue="map" orientation="horizontal" h="full" w="full" >
          <Box border="inset" borderRadius="xl" overflow="hidden" h="full" w="full">
            <Tabs.List>
              <Tabs.Trigger value="map">Map</Tabs.Trigger>
              <Tabs.Trigger value="chart">Chart</Tabs.Trigger>
              <Tabs.Trigger value="alerts">Alerts</Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
            <Tabs.Content value="map" h="calc(100% - 40px)" p="0">
              <MapContainer
                center={[location.lat, location.lon]}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.lat, location.lon]} />
              </MapContainer>
            </Tabs.Content>
            <Tabs.Content value="chart">
              <Box h="full">
                {/* Chart placeholder */}
                <Text>📈 Chart view coming soon</Text>
              </Box>
            </Tabs.Content>
            <Tabs.Content value="alerts">
              <Box h="full">
                {/* Alerts placeholder */}
                <Text>🚨 Alerts view coming soon</Text>
              </Box>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </HStack>
      <Separator variant="solid" size="lg" m="6" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'} />
      <Flex mb={4} align="center" position="relative" w="100%">
        <Box position="absolute" left="50%" transform="translateX(-50%)" width={{ base: "100%", sm: "400px" }} px={4}>
          <SearchInput value={search} onChange={setSearch}
            placeholder={
              activeTab === 'sources'
                ? 'Search sources…'
                : 'Search sensors…'
            }
          />
        </Box>
        
        <Flex ml="auto" align="center" gap={4}>
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          {activeTab === 'sources' && (
          <Button onClick={handleNewSource} borderRadius="md" boxShadow="sm" bg={"orange"} color={text}>
            + Add New Source
          </Button>
          )}
          {activeTab === 'sensors' && (
          <Button onClick={handleNewSensor} borderRadius="md" boxShadow="sm" bg={"orange"} color={text}>
            + Add New Sensor
          </Button>
          )}
        </Flex>
      </Flex>
      {/* ←––––– CONTENT PANELS –––––→ */}
      <Box border="inset" borderRadius="3xl" overflow="hidden">
        {activeTab === 'sources' && (
          <DataTable columns={sourcesColumns} data={displayed as Source[]} sortConfig={sortConfig} onSort={requestSort} page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} count={displayed.length} total={sorted.length} name={activeTab}
            renderRow={(s: Source) => (
              <>
                <Table.Cell textAlign="center" textDecor={"underline"}>{s.source_name}</Table.Cell>
                <Table.Cell textAlign="center">{s.details?.loc_name}</Table.Cell>
                <Table.Cell textAlign="center">{s.folder_path}</Table.Cell>
                <Table.Cell textAlign="center">{s.file_keyword}</Table.Cell>
                <Table.Cell textAlign="center">{s.file_type}</Table.Cell>
                <Table.Cell textAlign="center">{s.source_type}</Table.Cell>
                <Table.Cell textAlign="center">{s.config}</Table.Cell>
                <Table.Cell textAlign="center">{s.last_updated?.split("T")[0]||"-"}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Box boxSize="10px" borderRadius="full" bg={s.active? "green.400":"red.400"} display="inline-block" />
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Box display={"inline-block"}>
                    <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
                      <Popover.Trigger asChild>
                        <IconButton aria-label="More actions" variant="ghost" size="xs" color="black" borderRadius="48px" width={"32px"}
                          onClick={(e) => e.stopPropagation()}
                          _hover={{
                            backgroundColor: 'blackAlpha.300',
                          }}
                          _dark={{
                            color: "white",
                            _hover: {backgroundColor: "whiteAlpha.200"}
                          }}
                        >
                          <DotsThreeVertical weight="bold"/>
                        </IconButton>
                      </Popover.Trigger>
                      <Popover.Positioner>
                        <Popover.Content width="64px" height="100px" borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                          <Popover.Arrow>
                            <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1} _dark={{borderColor: "whiteAlpha.600"}}/>
                          </Popover.Arrow>
                          <Popover.Body height="100px" p={0}>
                            <VStack gap={0} justifyContent={"center"} height="inherit">
                              <Button variant="ghost" size="md" onClick={() => handleEditSource(s)}>
                                <PencilSimple />
                              </Button>
                              <Button variant="ghost" size="md" onClick={() => handleDeleteSource(s)}>
                                <Trash />
                              </Button>
                            </VStack>
                          </Popover.Body>
                        </Popover.Content>
                      </Popover.Positioner>
                    </Popover.Root>
                  </Box>
                </Table.Cell>
              </>
            )}
          />
        )}

        {activeTab === 'sensors' && (
          <DataTable columns={sensorColumns} data={displayed as MonitoringSensor[]} sortConfig={sortConfig} onSort={requestSort} page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} count={displayed.length} total={sorted.length} name={activeTab}
            renderRow={(s: MonitoringSensor) => (
              <>
                <Table.Cell textAlign="center" textTransform="capitalize" textDecor={"underline"}><Link href={`/sensors/${s.sensor_name}`}>{s.sensor_name}</Link></Table.Cell>
                <Table.Cell textAlign="center" textTransform="capitalize">{s.sensor_type}</Table.Cell>
                <Table.Cell textAlign="center">{s.details?.mon_source_name ?? s.mon_source_id}</Table.Cell>
                <Table.Cell textAlign="center">{s.sensor_group_id ?? "None"}</Table.Cell>
                <Table.Cell textAlign="center">{s.created_at?.split('T')[0]||"-"}</Table.Cell>
                <Table.Cell textAlign="center">{s.last_updated?.split('T')[0]||"-"}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Box>
                    {readings && readings.length > 0 ? (
                      <Line
                        data={{
                          labels: readings.map((_, i) => `${i + 1}`),
                          datasets: [
                            {
                              data: readings,
                              borderColor: accent,
                              tension: 0.4,
                              pointRadius: 0,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: { x: { display: false }, y: { display: false } },
                        }}
                      />
                    ) : (
                      <Flex align="center" justify="center" h="100%">
                        <Text>No Data Found</Text>
                      </Flex>
                    )}
                  </Box>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Box display="inline-block" boxSize="10px" borderRadius="full" bg={s.active ? 'green.400' : 'red.400'} />
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Box display={"inline-block"}>
                    <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
                      <Popover.Trigger asChild>
                        <IconButton aria-label="More actions" variant="ghost" size="xs" color="black" borderRadius="48px" width={"32px"}
                          onClick={(e) => e.stopPropagation()}
                          _hover={{
                            backgroundColor: 'blackAlpha.300',
                          }}
                          _dark={{
                            color: "white",
                            _hover: {backgroundColor: "whiteAlpha.200"}
                          }}
                        >
                          <DotsThreeVertical weight="bold"/>
                        </IconButton>
                      </Popover.Trigger>
        
                      <Popover.Positioner>
                        <Popover.Content width="64px" height="100px" borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                          <Popover.Arrow>
                            <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1}  _dark={{borderColor: "whiteAlpha.600"}}/>
                          </Popover.Arrow>
                          <Popover.Body height="100px" p={0}>
                            <VStack gap={0} justifyContent={"center"} height="inherit">
                              <Button variant="ghost" size="md" onClick={() => handleEditSensor(s)}>
                                <PencilSimple />
                              </Button>
                              <Button variant="ghost" size="md" onClick={() => handleDeleteSensor(s)}>
                                <Trash />
                              </Button>
                            </VStack>
                          </Popover.Body>
                        </Popover.Content>
                      </Popover.Positioner>
                    </Popover.Root>
                  </Box>
                </Table.Cell>
              </>
            )}
          />
        )}
      </Box>
      <SourceCreateModal isOpen={isSrcCreateOpen} onClose={() => { setSelectedSource(undefined); setSrcCreateOpen(false); } } />
      <SourceEditModal isOpen={isSrcEditOpen} source={selectedSource} onClose={() => { setSelectedSource(undefined); setSrcEditOpen(false); }} />
      <SourceDeleteModal isOpen={isSrcDelOpen} source={srcToDelete} onClose={() => { setSrcToDelete(undefined); setSrcDelOpen(false); }} />
      <SensorCreateModal isOpen={isSenCreateOpen} onClose={() => { setSelectedSensor(undefined); setSenCreateOpen(false); } } />
      <SensorEditModal isOpen={isSenEditOpen} sensor={selectedSensor} onClose={() => { setSelectedSensor(undefined); setSenEditOpen(false); }} />
      <SensorDeleteModal isOpen={isSenDelOpen} sensor={senToDelete} onClose={() => { setSenToDelete(undefined); setSenDelOpen(false); }} />
    </Box>
  );
}
