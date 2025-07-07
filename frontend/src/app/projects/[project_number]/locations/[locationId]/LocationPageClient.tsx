'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Box, Button, CloseButton, Dialog, Flex, Heading, IconButton, Portal, RadioGroup, Text, SimpleGrid,  useDisclosure, VStack, HStack } from '@chakra-ui/react';
import { FiEdit2 } from 'react-icons/fi';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs';
import { FiMapPin } from 'react-icons/fi';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import { LocationMap } from '@/app/components/LocationMap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SensorsList } from '@/app/components/SensorsList';
import type { Location } from '@/types/location';
import type { Data } from 'plotly.js';

// ✅ New grouped checklist structure
const inspectionSections = [
  {
    title: 'At the shoring wall are there signs of ground loss:',
    questions: [
      { key: 'groundLossThroughLagging', text: 'Through lagging boards?' },
      { key: 'groundLossOverTop',         text: 'Over the top of the wall?' },
      { key: 'groundLossAtBottom',       text: 'At bottom of cut?' },
      { key: 'groundLossBetweenLagging', text: 'Between lagging boards?' },
    ],
  },
  {
    title: 'Do lagging boards show:',
    questions: [
      { key: 'bowing',    text: 'Evidence of significant bowing?' },
      { key: 'cracking',  text: 'Cracking?' },
      { key: 'popping',   text: '“Popping” from pile flange?' },
    ],
  },
  {
    title: 'Behind the shoring wall are there signs of:',
    questions: [
      { key: 'settleImmediately', text: 'Settlement or heave immediately behind lagging boards?' },
      { key: 'settleGeneral',     text: 'Settlement or heave in general area behind wall?' },
      { key: 'tensionCracks',     text: 'Tension cracks forming (particularly during excavation)?' },
      { key: 'bulgingHeave',      text: 'Bulging or heave (particularly after tieback stressing)?' },
    ],
  },
  {
    title: 'At the tracks are there signs of:',
    questions: [
      { key: 'trackSettlements', text: 'Settlements?' },
      { key: 'trackTranslations',text: 'Translations (tracks moving toward excavation)?' },
      { key: 'trackRotation',    text: 'Rotation (at curves or where cross‐fall is present)?' },
    ],
  },
];

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Props {
  projectName: string;
  location: Location;
}

export default function LocationPageClient({ projectName, location }: Props) {
  console.log(projectName);
    // new disclosure for inspection checklist
  const {
    open: isChecklistOpen,
    onOpen: onChecklistOpen,
    onClose: onChecklistClose,
  } = useDisclosure();

  // initialize all answers to ''
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | ''>>(
    () =>
      inspectionSections
        .flatMap((sec) => sec.questions.map((q) => q.key))
        .reduce((acc, key) => {
          acc[key] = '';
          return acc;
        }, {} as Record<string, 'yes' | 'no' | ''>)
  );

  // your metrics
  const metrics = [
    { title: 'Sensor Health', lines: ['12/12 sensors reporting', '0 overdue'] },
    { title: 'Trends', lines: ['Max settlement: –1.2 mm last 24h'] },
    { title: 'Alerts', lines: ['1 threshold exceeded (Ext. #5)'] },
    { title: 'Battery', lines: ['Avg. 78% (2 below 50%)'] },
  ];

  // sample graph data
  const sampleGraphData = [
    {
      name: 'Extensometer 5',
      x: [
        '2025-05-14T06:00:00Z',
        '2025-05-14T08:00:00Z',
        '2025-05-14T10:00:00Z',
        '2025-05-14T12:00:00Z',
        '2025-05-14T14:00:00Z',
      ],
      y: [1.0, 1.2, 1.3, 1.5, 1.4],
      threshold: 2.0,
    },
    {
      name: 'Inclinometer A',
      x: [
        '2025-05-14T06:00:00Z',
        '2025-05-14T08:00:00Z',
        '2025-05-14T10:00:00Z',
        '2025-05-14T12:00:00Z',
        '2025-05-14T14:00:00Z',
      ],
      y: [0.1, 0.15, 0.12, 0.18, 0.2],
      threshold: 0.2,
    },
    {
      name: 'Settlement Plate B',
      x: [
        '2025-05-14T06:00:00Z',
        '2025-05-14T08:00:00Z',
        '2025-05-14T10:00:00Z',
        '2025-05-14T12:00:00Z',
        '2025-05-14T14:00:00Z',
      ],
      y: [0.2, 0.3, 0.4, 0.6, 0.55],
      threshold: 0.5,
    },
  ];

  // two traces per sensor
  const plotTraces: Data[] = sampleGraphData.flatMap((sensor) => [
    {
      x: sensor.x,
      y: sensor.y,
      name: sensor.name,
      type: 'scatter',
      mode: 'lines+markers',
    },
    {
      x: sensor.x,
      y: sensor.x.map(() => sensor.threshold),
      name: sensor.name + ' Threshold',
      type: 'scatter',
      mode: 'lines',
      line: { dash: 'dash' },
    },
  ]);

  return (
    <Box px={6} py={4}>
      {/* Breadcrumb */}
      <Breadcrumb crumbs={[{ label: "Dashboard", href: "/"}, { label: "Projects", href: "/projects"}, { label: `${location.loc_name}`, href: `/projects/${location.loc_name}`} ]}/>
      {/* 1. Info Card */}
      <Box px={6} py={3} mb={3} className='c-card shadow-md'>
        <Flex justify="space-between" align="center" mb={1}>
          <Heading size="2xl" display="flex" alignItems={"center"}>
            <FiMapPin style={{ marginRight: 8 }}/>
            {location.loc_name}
          </Heading>
          <IconButton aria-label="Edit location" variant="ghost" size="md">
            <FiEdit2 />
          </IconButton>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={2}>
          <Box>
            <Text fontSize="sm">
              Location #
            </Text>
            <Text fontWeight="medium">{location.loc_number}</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              Latitude
            </Text>
            <Text fontWeight="medium">{location.lat}</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              Longitude
            </Text>
            <Text fontWeight="medium">{location.lon}</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              Frequency
            </Text>
            <Text fontWeight="medium">  {location.frequency
              ? location.frequency.charAt(0).toUpperCase() + location.frequency.slice(1)
              : ""}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              Active
            </Text>
            <Text fontWeight="medium">{location.active ? 'Yes' : 'No'}</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              Created At
            </Text>
            <Text fontWeight="medium">{new Date(location.created_at).toLocaleDateString(undefined, {
                year:  'numeric',
                month: 'long',
                day:   'numeric',
              })}</Text>
          </Box>
          <Box>
            <Text fontSize="sm">
              Last Updated
            </Text>
            <Text fontWeight="medium">{new Date(location.last_updated).toLocaleDateString(undefined, {
                year:  'numeric',
                month: 'long',
                day:   'numeric',
              })}</Text>
          </Box>
        </SimpleGrid>
      </Box>

      {/* 2. Map + Metrics */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={6} mb={6}>
        <Box
          flex="2"
          className='c-card shadow-md'
        >
          <LocationMap
            lat={location.lat}
            lon={location.lon}
            siteImageUrl="/path/to/your/site-photo.jpg"
            imageCoordinates={[
              [-122.58, 45.12],
              [-122.56, 45.12],
              [-122.56, 45.10],
              [-122.58, 45.10],
            ]}
            initialMarkers={[[location.lon, location.lat]]}
          />
        </Box>
        <VStack gap={4} flex="1">
          {metrics.map((m) => (
            <Box
              key={m.title}
              w="100%"
              p={4}
              className='c-card shadow-md'
            >
              <Text fontWeight="bold" mb={2}>
                {m.title}
              </Text>
              {m.lines.map((l) => (
                <Text key={l} fontSize="sm">
                  {l}
                </Text>
              ))}
              <Link href={`#${m.title.toLowerCase()}`} passHref>
                <Text fontSize="xs" color="teal.300" mt={2}>
                  View {m.title} →
                </Text>
              </Link>
            </Box>
          ))}
        </VStack>
        {/* Last Inspection Card */}
        <Box flex="1" p={4} display="flex" flexDirection="column" justifyContent="space-between" className='c-card shadow-md'>
        <Box>
          <Text fontSize="sm" color="gray.400">
            Last Inspected
          </Text>
          <Text fontWeight="medium">
            {location.last_inspected
              ? new Date(location.last_inspected).toLocaleString()
              : 'Never'}
          </Text>
        </Box>
        <SimpleGrid>
          <Button mt={4} size="sm" className='c-card shadow-md' onClick={onChecklistOpen}>
            View Checklist
          </Button>
          <Link
            href={`/projects/${location.project_id}/locations/${location.id}/sources`}
            passHref
          >
            <Button mt={4} size="sm" className='c-card shadow-md'>
              View Sources
            </Button>
          </Link>
        </SimpleGrid>
      </Box>
      </Flex>

      {/* 3. Tabbed Details */}
      <Tabs
        variant="enclosed"
        mt={6}   // adds space above the tabs
        mb={6}   // adds space below the tabs
        p={4}    // padding inside the tab container
        border="1px solid"
        borderColor="gray.700"
        borderRadius="lg"
        boxShadow="md"
        backgroundColor="#1C2633" // or whiteAlpha.100 if you want a subtle shade
      >
        <TabList mb={4} display="flex">
          {['Overview', 'Sensors', 'Graphs', 'Alerts', 'Settings'].map((tab) => (
            <Tab key={tab} flex="1" justifyContent={"center"}>{tab}</Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel p={4}>
            <Text>Overview content goes here.</Text>
          </TabPanel>

          <TabPanel p={4}>
            <Box
              bg="whiteAlpha.50"
              py={4}
              px={6}
              borderRadius="md"
              boxShadow="sm"
              mb={4}
            >
              <Flex>
                <Box flex="2">
                  <Text fontWeight="bold">Sensor</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text fontWeight="bold">Type</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text fontWeight="bold">Unit</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text fontWeight="bold">Threshold</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text fontWeight="bold">Data</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text fontWeight="bold">Timestamp</Text>
                </Box>
                <Box flex="1" textAlign="center" pr={4}>
                  <Text fontWeight="bold">Active</Text>
                </Box>
              </Flex>
            </Box>
            <SensorsList locationId={location.id} />
          </TabPanel>

          <TabPanel p={4}>
            <Plot
              data={plotTraces}
              layout={{
                margin: { t: 20, b: 40, l: 40, r: 20 },
                legend: { orientation: 'h', x: 0, y: 1.1 },
                dragmode: 'pan',
                hovermode: 'closest',
                title: { text: 'Sensor Readings Over Time' },
              }}
              config={{ responsive: true, editable: true }}
              style={{ width: '100%', height: '400px' }}
            />
          </TabPanel>

          <TabPanel p={4}>
            <Text>Alerts list placeholder.</Text>
          </TabPanel>
          <TabPanel p={4}>
            <Text>Location settings and metadata.</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Inspection Checklist Dialog */}
      <Dialog.Root
        open={isChecklistOpen}
        onOpenChange={(o) => !o && onChecklistClose()}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop onClick={onChecklistClose} />
          <Dialog.Positioner>
            <Dialog.Content bg="#1C2633" color="white" p={4} border="1px solid" borderColor="whiteAlpha.300">
              <Dialog.Header>
                <Dialog.Title>Inspection Checklist</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" color="white" onClick={onChecklistClose} _hover={{ backgroundColor: 'gray.500' }} />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <VStack align="stretch" gap={5}>
                  {inspectionSections.map((section) => (
                    <Box key={section.title}>
                      <Text fontWeight="bold" mb={2}>{section.title}</Text>
                      <VStack align="stretch" gap={3}>
                        {section.questions.map((q) => (
                          <Box key={q.key}>
                            <Text mb={1}>{q.text}</Text>
                            <RadioGroup.Root
                              value={answers[q.key] || undefined}
                              onValueChange={(details) => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [q.key]: details.value as 'yes' | 'no',
                                }));
                              }}
                            >
                              <HStack gap={6}>
                                <RadioGroup.Item value="yes" id={`${q.key}-yes`}>
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemIndicator />
                                  <RadioGroup.ItemText>Yes</RadioGroup.ItemText>
                                </RadioGroup.Item>
                                <RadioGroup.Item value="no" id={`${q.key}-no`}>
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemIndicator />
                                  <RadioGroup.ItemText>No</RadioGroup.ItemText>
                                </RadioGroup.Item>
                              </HStack>
                            </RadioGroup.Root>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" mr={3} onClick={onChecklistClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="yellow"
                  onClick={() => {
                    // here you could POST `answers` back to your server
                    onChecklistClose();
                  }}
                >
                  Done
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

    </Box>
  );
}
