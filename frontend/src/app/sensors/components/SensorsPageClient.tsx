// File: app/sensors/components/SensorsPageClient.tsx
"use client";

// React + Next Imports
import { useEffect, useState, useMemo } from "react";
// import Link from "next/link";

// Chakra Imports + Icons
import { Box, Button, Flex, Heading, IconButton, Popover, Spinner, Text, Table, VStack } from "@chakra-ui/react";
import { PencilSimple, Trash, DotsThreeVertical } from "phosphor-react";
import { toaster } from "@/components/ui/toaster"
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import SearchInput from "@/app/components/SearchInput";
import PageSizeSelect from "@/app/components/PageSizeSelect";
import DataTable from "@/app/components/DataTable";
import CountFooter from "@/app/components/CountFooter";

// Services + Types
import type { MonitoringSensor } from "@/types/sensor";
import { SensorCreateModal, SensorEditModal, SensorDeleteModal } from "./SensorModals";

// Register chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

// Column definition with label override
interface Column {
  key: string;
  label: string;
}

const columns: Column[] = [
  { key: 'sensor_name', label: 'Sensor Name' },
  { key: 'sensor_type', label: 'Sensor Type' },
  { key: 'mon_source_id', label: 'Source' },
  { key: 'sensor_group_id', label: 'Sensor Group' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'sensor data', label: 'Sensor Data'},
  { key: 'active', label: 'Active' },
];

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

interface Props {
  sensors: MonitoringSensor[];
}

export default function SensorsPageClient({ sensors: initialSensors }: Props) {
  const { colorMode } = useColorMode();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); 
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc"|"desc" }|null>(null);
  const [hydrated, setHydrated] = useState(false);

  const readings: string[] = [];

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<MonitoringSensor | undefined>();
  const [toDelete, setToDelete] = useState<MonitoringSensor | undefined>();

  const sensors = initialSensors;
  const pageSizeOptions = [10, 25, 50, 100];
  

  // Colors 
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const text = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';
  
  const filtered = useMemo(() => sensors.filter(s => s.sensor_name.toLowerCase().includes(search.toLowerCase())), [search, initialSensors]);
  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const { key, direction } = sortConfig;
    return [...filtered].sort((a,b) => {
      const av = getNestedValue(a, key), bv = getNestedValue(b, key);
      if (av == null || bv == null) return av==null? -1:1;
      if (typeof av === "number" && typeof bv === "number")
        return direction==="asc"? av-bv : bv-av;
      return direction==="asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortConfig]);
  const totalPages = Math.ceil(sorted.length/pageSize);
  const displayed = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Handlers
  const handleNew = () => { setSelectedSensor(undefined); setCreateOpen(true); };
  const handleEdit = (s: MonitoringSensor) => { setSelectedSensor(s); setEditOpen(true); }
  const handleDelete = (s: MonitoringSensor) => { setToDelete(s); setDelOpen(true); }

  const requestSort = (key: string) => {
    setSortConfig(sc =>
      sc?.key===key && sc.direction==="asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" }
    );
  };

  // Hydration
  useEffect(() => {
    setHydrated(true);
    Promise.resolve().then(() => {
      toaster.create({
        description: "Sensors loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  return (
    <Box minH="100vh" bg={bg} p={6} color={text}>
      <Breadcrumb crumbs={[{ label: "Dashboard", href: "/"}, { label: "Sensors", href: "/sensors"} ]}/>
      <Flex mb={4} align="center" position="relative" w="100%">
        <Heading fontSize={"3xl"}>Monitoring Sensors</Heading>
        <Box position="absolute" left="50%" transform="translateX(-50%)" width={{ base: "100%", sm: "400px" }} px={4}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search sensors..." />
        </Box>
        <Flex ml="auto" align="center" gap={4}>
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          <Button onClick={handleNew} borderRadius="md" boxShadow="sm" bg={"orange"} color={text}>
            + Add New Sensor
          </Button>
        </Flex>
      </Flex>
      {hydrated? (
        <DataTable columns={columns} data={displayed} sortConfig={sortConfig} onSort={requestSort} page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)}
          renderRow={(s: MonitoringSensor) => (
            <>
              <Table.Cell textAlign="center" textTransform="capitalize" textDecor={"underline"}>{s.sensor_name}</Table.Cell>
              <Table.Cell textAlign="center" textTransform="capitalize">{s.sensor_type}</Table.Cell>
              <Table.Cell textAlign="center">{s.source_name ?? s.mon_source_id}</Table.Cell>
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
                            <Button variant="ghost" size="md" onClick={() => handleEdit(s)}>
                              <PencilSimple />
                            </Button>
                            <Button variant="ghost" size="md" onClick={() => handleDelete(s)}>
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
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
      <CountFooter count={displayed.length} total={sorted.length} name="sensors" color={textSub} />
      <SensorCreateModal isOpen={isCreateOpen} onClose={() => { setSelectedSensor(undefined); setCreateOpen(false); } } />
      <SensorEditModal isOpen={isEditOpen} sensor={selectedSensor} onClose={() => { setSelectedSensor(undefined); setEditOpen(false); }} />
      <SensorDeleteModal isOpen={isDelOpen} sensor={toDelete} onClose={() => { setToDelete(undefined); setDelOpen(false); }} />
    </Box>
  );
}
