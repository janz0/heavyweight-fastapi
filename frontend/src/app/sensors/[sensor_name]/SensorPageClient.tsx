"use client";

import React, { useState } from 'react';
import { Box, Button, HStack, Heading, IconButton, Text, VStack, Flex, Popover, Table } from '@chakra-ui/react';
import { useColorMode, useColorModeValue } from '@/app/src/components/ui/color-mode';
import type { MonitoringSensor } from '@/types/sensor';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);
import { DotsThreeVertical, PencilSimple, Trash } from 'phosphor-react';
import { SensorEditModal, SensorDeleteModal } from '../../components/Modals/SensorModals';
import GraphPanel, { GraphConfig } from "@/app/components/Graphs/GraphPanel";

interface SensorPageClientProps {
  sensor: MonitoringSensor;
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

export default function SensorPageClient({ sensor }: SensorPageClientProps) {
  const { colorMode } = useColorMode();
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const [isSenEditOpen, setSenEditOpen] = useState(false);
  const [isSenDelOpen, setSenDelOpen] = useState(false);
  const handleEditSensor = () => { setSenEditOpen(true);};
  const handleDeleteSensor = () => { setSenDelOpen(true);};

  type SampleRow = {
    timestamp: string;      // ISO string
    latitude: number;
    longitude: number;
  };

  const [graphConfig, setGraphConfig] = useState<GraphConfig>({
    type: "line",
    field: "latitude",
  });

  // Simple random-walk around a starting coordinate
  function makeSampleData(
    startTime = new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    points = 30,
    stepMinutes = 2,
    startLat = 43.6532,   // Toronto-ish
    startLon = -79.3832
  ): SampleRow[] {
    const out: SampleRow[] = [];
    let lat = startLat;
    let lon = startLon;

    for (let i = 0; i < points; i++) {
      // tiny jitter so it looks plausible but stable
      lat += (Math.random() - 0.5) * 0.001;
      lon += (Math.random() - 0.5) * 0.001;

      const t = new Date(startTime.getTime() + i * stepMinutes * 60 * 1000);
      out.push({
        timestamp: t.toISOString(),
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lon.toFixed(6)),
      });
    }
    return out;
  }
  // scrollbar colors
  const trackBg = useColorModeValue('gray.200', 'gray.700');
  const thumbBg = useColorModeValue('gray.600', 'gray.400');
  const thumbBorder = useColorModeValue('gray.100', 'gray.800');
  const [sampleData] = useState<SampleRow[]>(() => makeSampleData());
  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      <Flex mb={4} align="flex-start" position="relative" w="100%" direction="column">
        <Heading fontSize="3xl">  
          <Text as="span" color="green.600">
            {sensor.sensor_name.charAt(0)}
          </Text>
          <Text as="span" fontSize="lg" fontWeight="bold" color="green.600">
            {sensor.sensor_name.slice(1)}
          </Text>
          <Text as="span" ml={2} fontSize="md" fontWeight={"extralight"} color="purple.600">
            {sensor.details?.mon_source_name || "No Source"}
          </Text>
          <Box
            display="inline-block"
            boxSize="14px"
            borderRadius="full"
            ml="2"
            bg={sensor.active ? "green.400" : "red.400"}
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
                      <Button variant="ghost" size="md" onClick={handleEditSensor}>
                        <PencilSimple />
                      </Button>
                      <Button variant="ghost" size="md" onClick={handleDeleteSensor}>
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
            {sensor.sensor_type}
        </Text>
        <Text position="absolute" left={"50%"} transform="translateX(-50%)" textAlign={"center"}>
          {formatDate(sensor.created_at)}
        </Text>
        <Text position="absolute" right="0" fontSize="sm">
          Last Updated: {formatDate(sensor.last_updated)}
        </Text>
      </Flex>
      <HStack mb={3} h="50vh" align="stretch">
        <Box className="bg-card" w="fit-content">
          <Table.ScrollArea borderWidth={1} borderRadius={"sm"} height="100%" bg="blackAlpha.200" overflowX={"hidden"} css={{
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
                  Timestamp
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign={"center"}>
                  Latitude
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign={"center"}>
                  Longitude
                </Table.ColumnHeader>
              </Table.Row>   
            </Table.Header>
            <Table.Body>
              {sampleData.map((row, i) => (
                <Table.Row key={i}>
                  <Table.Cell p={3}>
                    {new Date(row.timestamp).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell textAlign="right" p={3}>
                    {row.latitude.toFixed(6)}
                  </Table.Cell>
                  <Table.Cell textAlign={"right"} p={3}>
                    {row.longitude.toFixed(6)}
                  </Table.Cell>
                </Table.Row>
              ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Box>
        <Box className="bg-card" minW={0} bg="white" flex={"1 1 0%"}>
          {/* --------------- */}
          {/* the actual line chart */}
          <GraphPanel
            sensorName={sensor.sensor_name}
            data={sampleData}
            config={graphConfig}
            onConfigChange={setGraphConfig}
          />
        </Box>
      </HStack>
      <SensorEditModal isOpen={isSenEditOpen} sensor={sensor} onClose={() => { setSenEditOpen(false); }} />
      <SensorDeleteModal isOpen={isSenDelOpen} sensor={sensor} onClose={() => { setSenDelOpen(false); }} />
    </Box>
  );
}