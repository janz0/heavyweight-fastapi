// File: app/projects/[projectId]/ProjectsPageClient.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Box, Button, Flex, Heading, IconButton, Popover, Text, VStack, HStack, Table } from '@chakra-ui/react';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import type { Project } from '@/types/project';
import Link from 'next/link';
import { Bell, ArrowCircleUp, ArrowCircleDown } from "phosphor-react";
import { useColorMode } from '@/app/src/components/ui/color-mode';
import SearchInput from '@/app/components/SearchInput';
import PageSizeSelect from '@/app/components/PageSizeSelect';
import DataTable from "@/app/components/DataTable";
import { PencilSimple, Trash, DotsThreeVertical } from "phosphor-react";
import { Line } from "react-chartjs-2";

// Services + Types

import { SourceCreateModal, SourceEditModal, SourceDeleteModal } from '@/app/sources/components/SourceModals';
import { Source } from '@/types/source';
import { MonitoringSensor } from '@/types/sensor';
import { SensorCreateModal, SensorEditModal, SensorDeleteModal } from '@/app/sensors/components/SensorModals';
import { LocationCreateModal, LocationDeleteModal, LocationEditModal } from '@/app/locations/components/LocationModals';
import { Location } from '@/types/location';

interface Column {
  key: string;
  label: string;
}

const locationColumns: Column[] = [
  { key: 'loc_name', label: 'Location Name' },
  { key: 'loc_number', label: 'Location Number' },
  { key: 'project_id', label: 'Project' },
  { key: 'lat', label: 'Latitude' },
  { key: 'lon', label: 'Longitude' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'last_inspected', label: 'Inspected' },
  { key: "active", label: 'Status' },
];

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

interface Props {
  project: Project;
  initialLocations: Location[];
  initialSources: Source[];     // <- add this prop
  initialSensors: MonitoringSensor[]; // <- and this
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export default function ProjectsPageClient({ project, initialLocations, initialSources, initialSensors, }: Props) {
  const { colorMode } = useColorMode();
  const [activeTab, setActiveTab] = useState<'locations'|'sources'|'sensors'>('locations');
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc"|"desc" }|null>(null);
  
  
  const pageSizeOptions = [10, 25, 50, 100];

  // derive theme tokens
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const cardBg  = colorMode === 'light' ? 'white'    : 'gray.700';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const text = colorMode === "light" ? "gray.800" : "gray.200";
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  const locActiveCount   = initialLocations.filter(l => l.active).length;
  const locInactiveCount = initialLocations.length - locActiveCount;
  const srcActiveCount   = initialSources.filter(s => s.active).length;
  const srcInactiveCount = initialSources.length - srcActiveCount;
  const senActiveCount   = initialSensors.filter(s => s.active).length;
  const senInactiveCount = initialSensors.length - senActiveCount;

  const stats = [
    {
      label: "Locations",
      href: "/locations",
      icons: [ArrowCircleUp, ArrowCircleDown] as const,
      activeCount: locActiveCount,
      inactiveCount: locInactiveCount,
    },
    {
      label: "Sources",
      href: "/sources",
      icons: [ArrowCircleUp, ArrowCircleDown] as const,
      activeCount: srcActiveCount,
      inactiveCount: srcInactiveCount,
    },
    {
      label: "Sensors",
      href: "/sensors",
      icons: [ArrowCircleUp, ArrowCircleDown] as const,
      activeCount: senActiveCount,
      inactiveCount: senInactiveCount,
    },
    { label: "Open Alerts", href: "/", value: 2, icons: [Bell, ] as const, },
  ];
  const items = useMemo(() => {
    switch (activeTab) {
      case 'locations': return initialLocations;
      case 'sources':   return initialSources;
      case 'sensors':   return initialSensors;
      default:          return [];
    }
  }, [activeTab, initialLocations, initialSources, initialSensors]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      // pick the right “name” field per type:
      let value = '';
      if (activeTab === 'locations')  value = (item as Location).loc_name;
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
  // Location Variables
  const [isLocCreateOpen, setLocCreateOpen] = useState(false);
  const [isLocEditOpen, setLocEditOpen] = useState(false);
  const [isLocDelOpen, setLocDelOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [locToDelete, setLocToDelete] = useState<Location | undefined>();
  const handleNewLocation = () => { setSelectedLocation(undefined); setLocCreateOpen(true); };
  const handleEditLocation = (l: Location) => { setSelectedLocation(l); setLocEditOpen(true); };
  const handleDeleteLocation = (l: Location) => { setLocToDelete(l); setLocDelOpen(true); };

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

  const requestSort = (key: string) => {
    setSortConfig(sc =>
      sc?.key===key && sc.direction==="asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" }
    );
  };
  const leftStats = stats.slice(0, 2);
  const rightStats = stats.slice(2, 4);
  
  return (
    <Box minH="100vh" p={6} bg={bg}>
      <Breadcrumb crumbs={[{ label: "Dashboard", href: "/"}, { label: "Projects", href: "/projects"} ]}/>
      <Box display="grid" gridTemplateColumns="3fr 2fr" w="100%" gap="4" mb="4">
        {/* Metrics */}
        <Box mb={3} border="inset" borderRadius="xl" p="12px" h="full">
          {/* Title + Link */}
          <HStack align="center" gap="2">
            <Heading size="3xl">{project.project_name}</Heading>
          </HStack>

          {/* Description */}
          <HStack justify="space-between" mr="25%" mt="2px">
            <VStack align="start" gap="0">
              <Text fontWeight="light" color={textSub}>Project Number</Text>
              <Text fontWeight="medium">{project.project_number}</Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text fontWeight="light" color={textSub}>Start Date</Text>
              <Text fontWeight="medium">{formatDate(project.start_date)}</Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text fontWeight="light" color={textSub}>End Date</Text>
              <Text fontWeight="medium">{formatDate(project.end_date)}</Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text fontWeight="light" color={textSub}>Created At</Text>
              <Text fontWeight="medium">{formatDate(project.created_at)}</Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text fontWeight="light" color={textSub}>Last Updated</Text>
              <Text fontWeight="medium">{formatDate(project.last_updated)}</Text>
            </VStack>
          </HStack>
          <Box mt={2}>
            <Text fontWeight="light" color={textSub}>Description</Text>
            <Text fontWeight="medium" fontSize="md">
              {project.description}
            </Text>
          </Box>
        </Box>
        <HStack gap={4} h="full">
          {[leftStats, rightStats].map((group, colIdx) => (
            <VStack key={colIdx} gap={4} flex="1">
              {group.map((s) => {
                if (Array.isArray(s.icons) && s.icons.length === 2) {
                  const [UpIcon, DownIcon] = s.icons;
                  return (
                    <Link
                      key={s.label}
                      href={s.href || '#'}
                      passHref
                      style={{ display: 'contents' }}
                    >
                      <Box
                        bg={cardBg}
                        p={4}
                        borderRadius="md"
                        boxShadow="sm"
                        _hover={{ boxShadow: 'md' }}
                        w="100%"
                      >
                        <HStack gap="10%" mb={2}>
                          <HStack gap={1}>
                            <UpIcon size={24} weight="bold" color="green" />
                            <Text fontSize="xl" fontWeight="bold" color={textSub}>
                              {s.activeCount}
                            </Text>
                          </HStack>
                          <HStack gap={1}>
                            <DownIcon size={24} weight="bold" color="red" />
                            <Text fontSize="xl" fontWeight="bold" color={textSub}>
                              {s.inactiveCount}
                            </Text>
                          </HStack>
                        </HStack>
                        <Text fontSize="xl" color="gray.500">
                          {s.label}
                        </Text>
                      </Box>
                    </Link>
                  );
                }

                // single-icon case
                const IconComp = s.icons[0];
                return (
                  <Link
                    key={s.label}
                    href={s.href || '#'}
                    passHref
                    style={{ display: 'contents' }}
                  >
                    <Box
                      bg={cardBg}
                      p={4}
                      borderRadius="md"
                      boxShadow="sm"
                      _hover={{ boxShadow: 'md' }}
                      w="100%"
                    >
                      <HStack mb={2} gap={2}>
                        <IconComp size={24} weight="bold" />
                        <Text fontSize="xl" fontWeight="bold" color={textSub}>
                          {s.value}
                        </Text>
                      </HStack>
                      <Text fontSize="xl" color="gray.500">
                        {s.label}
                      </Text>
                    </Box>
                  </Link>
                );
              })}
            </VStack>
          ))}
        </HStack>
      </Box>
      <HStack mb={4} gap={4} justifyContent={"center"}>
        <Button
          variant={activeTab === 'locations' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab('locations')}
          borderWidth={"2px"}
          borderColor={"black"}
          _dark={{borderColor: "white"}}
          w="25%"
        >
          Locations
        </Button>
        <Button
          variant={activeTab === 'sources' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab('sources')}
          borderWidth={"2px"}
          borderColor={"black"}
          _dark={{borderColor: "white"}}
          w="25%"
        >
          Sources
        </Button>
        <Button
          variant={activeTab === 'sensors' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab('sensors')}
          borderWidth={"2px"}
          borderColor={"black"}
          _dark={{borderColor: "white"}}
          w="25%"
        >
          Sensors
        </Button>
      </HStack>
      <Flex mb={4} align="center" position="relative" w="100%">
        <Box position="absolute" left="50%" transform="translateX(-50%)" width={{ base: "100%", sm: "400px" }} px={4}>
          <SearchInput value={search} onChange={setSearch}
            placeholder={
              activeTab === 'locations'
                ? 'Search locations…'
                : activeTab === 'sources'
                ? 'Search sources…'
                : 'Search sensors…'
            }
          />
        </Box>
        <Flex ml="auto" align="center" gap={4}>
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          {activeTab === 'locations' && (
          <Button onClick={handleNewLocation} borderRadius="md" boxShadow="sm" bg={"orange"} color={text}>
            + Add New Location
          </Button>
          )}
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
      {activeTab === 'locations' && (
        <DataTable columns={locationColumns} data={displayed as Location[]} sortConfig={sortConfig} onSort={requestSort} page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} count={displayed.length} total={sorted.length} name={activeTab}
          renderRow={(l: Location) => (
            <>
              <Table.Cell textAlign="center" textDecor={"underline"}><Link href={`/locations`} passHref>{l.loc_name}</Link></Table.Cell>
              <Table.Cell textAlign="center" textTransform="capitalize">{l.loc_number||"-"}</Table.Cell>
              <Table.Cell textAlign="center">{l.details?.project_name ?? l.project_id}</Table.Cell>
              <Table.Cell textAlign="center">{l.lat}</Table.Cell>
              <Table.Cell textAlign="center">{l.lon}</Table.Cell>
              <Table.Cell textAlign="center">{l.created_at?.split('T')[0]||"-"}</Table.Cell>
              <Table.Cell textAlign="center">{l.last_updated?.split('T')[0]||"-"}</Table.Cell>
              <Table.Cell textAlign="center">{l.last_inspected?.split('T')[0]||"-"}</Table.Cell>
              <Table.Cell textAlign="center">
                <Box display="inline-block" boxSize="10px" borderRadius="full" bg={l.active ? 'green.400' : 'red.400'} />
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
                            <Button variant="ghost" size="md" onClick={() => handleEditLocation(l)}>
                              <PencilSimple />
                            </Button>
                            <Button variant="ghost" size="md" onClick={() => handleDeleteLocation(l)}>
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
              <Table.Cell textAlign="center" textTransform="capitalize" textDecor={"underline"}><Link href={`/sensors/${s.sensor_name}`} passHref>{s.sensor_name}</Link></Table.Cell>
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

      {/* Wizards */}
      <LocationCreateModal isOpen={isLocCreateOpen} onClose={() => { setSelectedLocation(undefined); setLocCreateOpen(false);}} />
      <LocationEditModal isOpen={isLocEditOpen} location={selectedLocation} onClose={() => { setSelectedLocation(undefined); setLocEditOpen(false); }} />
      <LocationDeleteModal isOpen={isLocDelOpen} onClose={() => { setLocToDelete(undefined); setLocDelOpen(false); }} location={locToDelete} />
      <SourceCreateModal isOpen={isSrcCreateOpen} onClose={() => { setSelectedSource(undefined); setSrcCreateOpen(false); } } />
      <SourceEditModal isOpen={isSrcEditOpen} source={selectedSource} onClose={() => { setSelectedSource(undefined); setSrcEditOpen(false); }} />
      <SourceDeleteModal isOpen={isSrcDelOpen} source={srcToDelete} onClose={() => { setSrcToDelete(undefined); setSrcDelOpen(false); }} />
      <SensorCreateModal isOpen={isSenCreateOpen} onClose={() => { setSelectedSensor(undefined); setSenCreateOpen(false); } } />
      <SensorEditModal isOpen={isSenEditOpen} sensor={selectedSensor} onClose={() => { setSelectedSensor(undefined); setSenEditOpen(false); }} />
      <SensorDeleteModal isOpen={isSenDelOpen} sensor={senToDelete} onClose={() => { setSenToDelete(undefined); setSenDelOpen(false); }} />
    </Box>
  );
}
