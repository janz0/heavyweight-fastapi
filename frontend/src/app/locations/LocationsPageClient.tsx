// File: app/locations/LocationsPageClient.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Icon,
  Table,
  IconButton,
} from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";
import { CaretUp, CaretDown } from "phosphor-react";
import { FiEdit } from "react-icons/fi";
import type { Location } from "@/types/location";
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
  locations: Location[];
  onEdit?: (location: Location) => void;
}

// Column definition with label override
interface Column {
  key: keyof Location;
  label: string;
}
const columns: Column[] = [
  { key: 'loc_name', label: 'Location Name' },
  { key: 'loc_number', label: 'Location Number' },
  { key: 'project_id', label: 'Project' },
  { key: 'lat', label: 'Latitude' },
  { key: 'lon', label: 'Longitude' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'last_inspected', label: 'Inspected' },
];

export default function LocationsPageClient({ locations, onEdit }: Props) {
  const { colorMode } = useColorMode();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Location;
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
    if (!sortConfig) return locations;
    const { key, direction } = sortConfig;

    return [...locations].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? -1 : 1;
      if (bVal == null) return direction === 'asc' ? 1 : -1;

      // Date fields
      if (key === 'created_at' || key === 'last_updated' || key === 'last_inspected') {
        return direction === 'asc'
          ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
          : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
      }

      // Numeric fields
      if (key === 'lat' || key === 'lon' || key === 'loc_number') {
        return direction === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      // String fields
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Fallback
      return 0;
    });
  }, [locations, sortConfig]);

  const requestSort = (key: keyof Location) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <Box minH="100vh" bg={bg} p={6} color={text}>
      <Heading mb={4} color={text}>Monitoring Locations</Heading>

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
            {sortedData.map((location) => (
              <Table.Row
                key={location.id}
                _hover={{ bg: colorMode === 'light' ? 'gray.50' : 'gray.600' }}
              >
                <Table.Cell textAlign="center" textTransform="capitalize">{location.loc_name}</Table.Cell>
                <Table.Cell textAlign="center" textTransform="capitalize">{location.loc_number}</Table.Cell>
                <Table.Cell textAlign="center">{location.project_name ?? location.project_id}</Table.Cell>
                <Table.Cell textAlign="center">{location.lat}</Table.Cell>
                <Table.Cell textAlign="center">{location.lon}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Box display="inline-block" boxSize="10px" borderRadius="full" bg={location.active ? 'green.400' : 'red.400'} />
                </Table.Cell>
                <Table.Cell textAlign="center">{new Date(location.created_at).toISOString().split('T')[0]}</Table.Cell>
                <Table.Cell textAlign="center">{new Date(location.last_updated).toISOString().split('T')[0]}</Table.Cell>
                <Table.Cell textAlign="center">{location.last_inspected ? new Date(location.last_inspected).toISOString().split('T')[0] : '-'}</Table.Cell>
                <Table.Cell textAlign="center">
                  <IconButton
                    aria-label="Edit Location"
                    size="sm"
                    variant="ghost"
                    color={accent}
                    onClick={() => onEdit?.(location)}
                    
                  >
                    <FiEdit />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
