"use client";

import React, { useState, useMemo } from 'react';
import { Box, Button, createListCollection, HStack, Heading, IconButton, Select, Tabs, Text, VStack } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import type { MonitoringSensor } from '@/types/sensor';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);
import { Line } from 'react-chartjs-2';
import { PencilSimple } from 'phosphor-react';
import { SensorEditModal } from '../components/SensorModals';

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
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const accent  = colorMode === 'light' ? '#3B82F6'  : '#60A5FA';
  const [isSenEditOpen, setSenEditOpen] = useState(false);
  const handleEditSensor = () => { setSenEditOpen(true); };

  const sampleData = [
    { lat: 10, lon: 100 },
    { lat: 12, lon: 105 },
    { lat: 15, lon: 110 },
    { lat: 14, lon: 108 },
    { lat: 13, lon: 107 },
    { lat: 16, lon: 112 },
  ];

    // build the Radix collection
  const fieldCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: 'Latitude', value: 'lat' },
          { label: 'Longitude', value: 'lon' },
        ],
      }),
    []
  );

  // state to pick which field to show
  const [selectedField, setSelectedField] = useState<'lat' | 'lon'>('lat');

  return (
    <Box minH="100vh" p={6} bg={bg}>
      <Breadcrumb
        crumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sensors', href: '/sensors' },
          { label: `${sensor.sensor_name}`, href: `/sensors/${sensor.sensor_name}` },
        ]}
      />
      <Box w="100%" gap="4" mb="4">
        {/* Metrics */}
        <Box mb={3} border="inset" borderRadius="xl" p="12px" h="full" alignItems="center" justifyItems={"center"}>
          {/* Title */}
            <Heading size="3xl">{sensor.sensor_name}</Heading>
        </Box>
      </Box>
      <HStack mb={3} h="50vh" align="stretch">
        <VStack w="40%" h="fit-content">
          <Box position="relative" border="inset" borderRadius="xl" p="12px" w="100%">
             <IconButton
              position="absolute"
              top="8px"
              right="8px"
              aria-label="Edit sensor"
              variant="ghost"
              size="sm"
              onClick={handleEditSensor}
              _hover={{ bg: "gray.200" }}
              _dark={{ _hover: { bg: "whiteAlpha.200" }}}
            ><PencilSimple weight='bold'/></IconButton>
            <HStack>
              <Text fontWeight="light" color={textSub}>Source Name:</Text>
              <Text fontWeight="medium">{sensor.details?.mon_source_name ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Sensor Group:</Text>
              <Text fontWeight="medium">{sensor.sensor_group_id ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Sensor Type:</Text>
              <Text fontWeight="medium">{sensor.sensor_type ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Created:</Text>
              <Text fontWeight="medium">{formatDate(sensor.created_at) ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Updated:</Text>
              <Text fontWeight="medium">{formatDate(sensor.last_updated)}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Active:</Text>
              <Text fontWeight="medium">Active (Placeholder)</Text>
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
            Sensors
          </Button>
        </VStack>
        <Tabs.Root defaultValue="graph" orientation="horizontal" h="full" w="full" >
          <Box border="inset" borderRadius="xl" overflow="hidden" h="full" w="full">
            <Tabs.List>
              <Tabs.Trigger value="graph">Graph</Tabs.Trigger>
              <Tabs.Trigger value="chart">Chart</Tabs.Trigger>
              <Tabs.Trigger value="alerts">Alerts</Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
            <Tabs.Content value="graph" h="calc(100% - 60px)" p="0">
              <HStack mb={2} mt={4} px={4} border={"none"} outline={"none"}>
                <Select.Root
                  collection={fieldCollection}
                  value={[selectedField]}
                  borderColor={"black"}
                  borderWidth={2}
                  borderRadius={"2xl"}
                  onValueChange={(e) =>
                    setSelectedField(e.value[0] as 'lat' | 'lon')
                  }
                >
                  <Select.HiddenSelect />

                  <Select.Control>
                    <Select.Trigger display="inline-flex" justifyContent={"center"} border={"none"} outline={"none"}>
                      <Select.ValueText placeholder="Field…" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>

                  <Select.Positioner>
                    <Select.Content>
                      {fieldCollection.items.map((item) => (
                        <Select.Item justifyContent={"center"} key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </HStack>

              {/* --------------- */}
              {/* the actual line chart */}
              <Box flex="1" h="calc(100% - 48px)">
                <Line
                  data={{
                    labels: sampleData.map((_, i) => `#${i + 1}`),
                    datasets: [
                      {
                        label:
                          selectedField === 'lat' ? 'Latitude' : 'Longitude',
                        data: sampleData.map((pt) => pt[selectedField]),
                        fill: false,
                        tension: 0.4,
                        borderColor: accent,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { title: { display: true, text: 'Sample Point' } },
                      y: {
                        title: {
                          display: true,
                          text:
                            selectedField === 'lat'
                              ? 'Latitude Value'
                              : 'Longitude Value',
                        },
                      },
                    },
                  }}
                />
              </Box>
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
      <SensorEditModal isOpen={isSenEditOpen} sensor={sensor} onClose={() => { setSenEditOpen(false); }} />
    </Box>
  );
}
