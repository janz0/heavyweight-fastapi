// File: app/sensors/SensorsPageClient.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Icon,
  Table,
  IconButton,
  Popover,
  VStack
} from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";
import { CaretUp, CaretDown } from "phosphor-react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import type { MonitoringSensor } from "@/types/sensor";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

// Register chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface Props {
  sensors: MonitoringSensor[];
  onEdit?: (sensor: MonitoringSensor) => void;
  onCreate?: () => void;
}

// Column definition with label override
interface Column {
  key: keyof MonitoringSensor;
  label: string;
}
const columns: Column[] = [
  { key: 'sensor_name', label: 'Sensor Name' },
  { key: 'sensor_type', label: 'Sensor Type' },
  { key: 'mon_source_id', label: 'Source' },
  { key: 'sensor_group_id', label: 'Sensor Group' },
  { key: 'active', label: 'Active' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
];

// Dummy readings for graphs
const dummyReadings: number[][] = [
  [22, 23, 21, 24, 25, 23, 26],
  [1.2, 1.4, 1.3, 1.5, 1.1, 1.3, 1.4],
  [101, 102, 100, 103, 101, 104, 102],
];

export default function SensorsPageClient({ sensors, onEdit, onCreate }: Props) {
  const { colorMode } = useColorMode();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof MonitoringSensor;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Theme tokens matching dashboard
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const cardBg = colorMode === 'light' ? 'gray.400' : 'gray.700';
  const text = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  // Sort logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return sensors;
    const { key, direction } = sortConfig;

    return [...sensors].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? -1 : 1;
      if (bVal == null) return direction === 'asc' ? 1 : -1;

      // Handle boolean
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return direction === 'asc'
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }

      // Handle dates
      if (key === 'created_at' || key === 'last_updated') {
        return direction === 'asc'
          ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
          : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
      }

      // Handle strings
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Handle numbers (e.g. sensor_group_id if it's numeric)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc'
          ? aVal - bVal
          : bVal - aVal;
      }

      return 0; // fallback
    });
  }, [sensors, sortConfig]);

  const requestSort = (key: keyof MonitoringSensor) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <Box minH="100vh" bg={bg} p={6} color={text}>
      <Heading mb={4} color={text}>Monitoring Sensors</Heading>

      <Box
        borderRadius="md"
        boxShadow="sm"
        _hover={{ boxShadow: 'md' }}
        overflowX="auto"
        p={4}
      >
        <Table.Root width="100%">
          {/* Dynamic header colors for light/dark */}
          <Table.Header>
            <Table.Row bg={cardBg}>
              {columns.map(({ key, label }) => (
                <Table.ColumnHeader
                  key={key}
                  onClick={() => requestSort(key)}
                  cursor="pointer"
                  whiteSpace="nowrap"
                  textAlign="center"
                  color={textSub}
                >
                  <Flex align="center" justify="center">
                    <Text fontWeight="bold" color={textSub}>{label}</Text>
                    {sortConfig?.key === key && (
                      sortConfig.direction === 'asc'
                        ? <Icon as={CaretUp} boxSize={4} color={textSub} />
                        : <Icon as={CaretDown} boxSize={4} color={textSub} />
                    )}
                  </Flex>
                </Table.ColumnHeader>
              ))}
              <Table.ColumnHeader whiteSpace="nowrap" textAlign="center" color={textSub}>
                <Text fontWeight="bold" color={textSub}>Sensor Data</Text>
              </Table.ColumnHeader>
              <Table.ColumnHeader whiteSpace="nowrap" textAlign="center" color={textSub}>
                <Text fontWeight="bold" color={textSub}>Actions</Text>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sortedData.map((sensor, idx) => (
              <Table.Row
                key={sensor.id}
                _hover={{ bg: colorMode === 'light' ? 'gray.50' : 'gray.600' }}
              >
                <Table.Cell textAlign="center" textTransform="capitalize">{sensor.sensor_name}</Table.Cell>
                <Table.Cell textAlign="center" textTransform="capitalize">{sensor.sensor_type}</Table.Cell>
                <Table.Cell textAlign="center">{sensor.source_name ?? sensor.mon_source_id}</Table.Cell>
                <Table.Cell textAlign="center">{sensor.sensor_group_id}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Box display="inline-block" boxSize="10px" borderRadius="full" bg={sensor.active ? 'green.400' : 'red.400'} />
                </Table.Cell>
                <Table.Cell textAlign="center">{new Date(sensor.created_at).toISOString().split('T')[0]}</Table.Cell>
                <Table.Cell textAlign="center">{new Date(sensor.last_updated).toISOString().split('T')[0]}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Box h="50px">
                    <Line
                      data={{
                        labels: dummyReadings[idx % dummyReadings.length].map((_, i) => `${i+1}`),
                        datasets: [
                          { data: dummyReadings[idx % dummyReadings.length], borderColor: accent, tension: 0.4, pointRadius: 0 },
                        ],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }}
                    />
                  </Box>
                </Table.Cell>
                <Table.Cell textAlign="center" alignContent={"center"}>
                  <Box display={"inline-block"}>
                    <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
                      <Popover.Trigger asChild>
                        <IconButton
                          aria-label="More actions"
                          variant="ghost"
                          size="xs"
                          color="black"
                          borderRadius="48px"
                          width={"32px"}
                          onClick={(e) => e.stopPropagation()}
                          _hover={{
                            backgroundColor: 'blackAlpha.300',
                          }}
                          _dark={{
                            color: "white",
                            _hover: {backgroundColor: "whiteAlpha.200"}
                          }}
                        >
                          <FiMoreVertical />
                        </IconButton>
                      </Popover.Trigger>
        
                      <Popover.Positioner>
                        <Popover.Content width="64px" height="100px" p={1} borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                          <Popover.Arrow>
                            <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1}  _dark={{borderColor: "whiteAlpha.600"}}/>
                          </Popover.Arrow>
                          <Popover.Body p={2}>
                            <VStack gap={1} align="stretch">
                              <Button variant="ghost" size="sm" onClick={() => onEdit?.(sensor)}>
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                colorScheme="red"
                              ><FiTrash2 />
                              </Button>
                            </VStack>
                          </Popover.Body>
                        </Popover.Content>
                      </Popover.Positioner>
                    </Popover.Root>
                  </Box>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      <Flex justify="flex-end" mr={12}>
        <Button onClick={onCreate}>
          + New Sensor
        </Button>
      </Flex>
    </Box>
  );
}
