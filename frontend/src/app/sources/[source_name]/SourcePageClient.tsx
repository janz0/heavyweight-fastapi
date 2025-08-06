"use client";

import React, { useMemo, useState } from 'react';
import { Box, HStack, Heading, IconButton, Table, Text, VStack, Button, Popover, Flex } from '@chakra-ui/react';
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

  const [isPopoverOpen, setPopoverOpen] = useState(false);
  // scrollbar colors
  const trackBg = useColorModeValue('gray.200', 'gray.700');
  const thumbBg = useColorModeValue('purple.600', 'purple.300');
  const thumbBorder = useColorModeValue('gray.100', 'gray.800');

  const sampleData = useMemo(() => {
    const labels = Array.from({ length: 12 }, (_, i) => `T-${11 - i}`);
    const values = labels.map((_, i) => Math.sin(i * 0.5) * 10 + 50); // just example fluctuation
    return {
      labels,
      datasets: [
        {
          label: 'Sample Metric',
          data: values,
          fill: false,
          tension: 0.3,
          borderColor: "black",
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, []);

  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Time' },
        grid:  { display: false },
      },
      y: {
        title:      { display: true, text: 'Value' },
        beginAtZero: false,
      },
    },
    plugins: {
      legend:  { position: 'top' },
      tooltip: { enabled: true },
    },
  }), []);

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
        <Box minW="25vw" h="50vh" borderRadius={"sm"} border={"initial"} borderColor="purple.600" borderWidth={"2px"} bg="whiteAlpha.50" mb="2" p={4} boxShadow={"md"}>
          {/* Chart placeholder */}
          <Table.ScrollArea borderWidth={1} borderRadius={"sm"} height="100%" bg="blackAlpha.200" css={{
            /* WebKit (Chrome/Safari) */
            '&::-webkit-scrollbar': {
              width: '10px',
              height: '10px',
              color: trackBg,
              background: trackBg,
              borderRadius: "md",
            },
            '&::-webkit-scrollbar-track': {
              background: trackBg,
              borderRadius: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: thumbBg,
              borderRadius: '8px',
              border: '2px solid',
              borderColor: thumbBorder,
            },
            /* Firefox */
            scrollbarColor: `${thumbBg} ${trackBg}`,
          }}>
            <Table.Root showColumnBorder variant="line" stickyHeader interactive>
              <Table.Header>
                <Table.Row bg="gray.100" fontSize={16}>
                  <Table.ColumnHeader textAlign={"center"} color="green.600">
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
        </Box>
        <Box width="full" h="50vh" borderRadius={"md"} borderStyle={"initial"} borderColor="purple.600" borderWidth={"2px"} bg="whiteAlpha.50" mb="2" p={4} boxShadow={"md"}>
          <Line data={sampleData} options={chartOptions} />
        </Box>
      </HStack>
      <DataTable columns={sensorColumns} color={"green.600"} data={initialSensors} onCreate={handleNewSensor} onEdit={handleEditSensor} onDelete={handleDeleteSensor} name={"Sensors"}/>
      <SourceEditModal isOpen={isSrcEditOpen} source={source} onClose={() => { setSrcEditOpen(false); }} />
      <SourceDeleteModal isOpen={isSrcDelOpen} source={source} onClose={() => { setSrcDelOpen(false); }} />
      <SensorCreateModal isOpen={isSenCreateOpen} projectId={source.details?.project_id} onClose={() => { setSelectedSensor(undefined); setSenCreateOpen(false); } } />
      <SensorEditModal isOpen={isSenEditOpen} sensor={selectedSensor} onClose={() => { setSelectedSensor(undefined); setSenEditOpen(false); }} />
      <SensorDeleteModal isOpen={isSenDelOpen} sensor={senToDelete} onClose={() => { setSenToDelete(undefined); setSenDelOpen(false); }} />
    </Box>
  );
}
