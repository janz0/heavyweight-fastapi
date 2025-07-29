"use client";

import React, { useState, useMemo } from 'react';
import { Box, Button, createListCollection, HStack, Heading, IconButton, Select, Tabs, Text, VStack, Flex, Popover } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import type { MonitoringSensor } from '@/types/sensor';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);
import { Line } from 'react-chartjs-2';
import { DotsThreeVertical, PencilSimple, Trash } from 'phosphor-react';
import { SensorEditModal, SensorDeleteModal } from '../../components/Modals/SensorModals';

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
  const accent  = colorMode === 'light' ? '#3B82F6'  : '#60A5FA';
  const [isSenEditOpen, setSenEditOpen] = useState(false);
  const [isSenDelOpen, setSenDelOpen] = useState(false);
  const handleEditSensor = () => { setSenEditOpen(true); setPopoverOpen(false)};
  const handleDeleteSensor = () => { setSenDelOpen(true); setPopoverOpen(false)};

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
  const [isPopoverOpen, setPopoverOpen] = useState(false);
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
      <SensorDeleteModal isOpen={isSenDelOpen} sensor={sensor} onClose={() => { setSenDelOpen(false); }} />
    </Box>
  );
}
