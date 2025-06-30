// File: app/projects/[projectId]/ProjectsPageClient.tsx
'use client';

import React, { useState } from 'react';
import { Box, Button, Flex, Heading, IconButton, InputGroup, Input, Popover, Text, VStack, useDisclosure, HStack } from '@chakra-ui/react';
import { Tooltip } from '@/app/src/components/ui/tooltip';
import { Tabs, TabList, Tab } from '@chakra-ui/tabs';
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { PushPinSimple } from 'phosphor-react';
import { ProjectsBreadcrumb } from '@/app/components/ProjectsBreadcrumb';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import { ProjectCreateModal } from '../components/ProjectModals';
import { CreateLocationWizard } from '@/app/components/CreateLocationWizard';
import { LocationsList } from '@/app/components/LocationsList';
import type { Project } from '@/types/project';
import type { Location } from '@/types/location';
import { DeleteProjectDialog } from '@/app/components/DeleteProjectDialog';
import { ProjectDeleteModal } from '../components/ProjectModals';
import Link from 'next/link';
import { Eye, EyeSlash, Info, Folder, MapPin, Gauge, Database, Bell, CheckCircle, XCircle, ArrowCircleUp, ArrowCircleDown } from "phosphor-react";
import { LocationDeleteModal } from '@/app/locations/components/LocationModals';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import { SensorsList } from '@/app/components/SensorsList';
import { Source } from '@/types/source';
import { MonitoringSensor } from '@/types/sensor';

interface Props {
  project: Project;
  initialLocations: Location[];
  initialSources: Source[];     // <- add this prop
  initialSensors: MonitoringSensor[]; // <- and this
}

export default function ProjectsPageClient({ project, initialLocations }: Props) {
  const { open: projOpen, onOpen: onProjOpen, onClose: onProjClose } = useDisclosure();
  const { open: locOpen, onOpen: onLocOpen, onClose: onLocClose } = useDisclosure();
  const { open: delOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { open: locDelOpen, onOpen: onLocDelOpen, onClose: onLocDelClose } = useDisclosure();

  const [selectedProject, setSelectedProject] = useState<Project | undefined>(project);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'locations'|'sources'|'sensors'>('locations');
  const { colorMode } = useColorMode();
  // derive theme tokens
  const bg      = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const cardBg  = colorMode === 'light' ? 'white'    : 'gray.700';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const accent  = colorMode === 'light' ? '#3B82F6' : '#60A5FA';
  const stats = [
    {
      label: "Locations",
      href: "/locations",
      icons: [ArrowCircleUp, ArrowCircleDown] as const,
      activeCount: 5,
      inactiveCount: 7 - 5,
    },
    {
      label: "Sources",
      href: "/sources",
      icons: [ArrowCircleUp, ArrowCircleDown] as const,
      activeCount: 5,
      inactiveCount: 8 - 5,
    },
    {
      label: "Sensors",
      href: "/sensors",
      icons: [ArrowCircleUp, ArrowCircleDown] as const,
      activeCount: 5,
      inactiveCount: 8 - 5,
    },
    { label: "Open Alerts", href: "/", value: 2, icons: [Bell, ] as const, },
  ];
  const handleEditProject = () => {
    setSelectedProject(project);
    onProjOpen();
  };
  /*
  const handleEditLocation = (loc: Location) => {
    setSelectedLocation(loc);
    onLocOpen();
  };
  */
  return (
    <Box px={6} py={4} bg={bg}>
      <Breadcrumb crumbs={[{ label: "Dashboard", href: "/"}, { label: "Projects", href: "/projects"} ]}/>
      {/* Metrics */}
      <Box flex="1" mb={3}>
        <HStack>
          <Heading size="3xl">{project.project_name}</Heading>
          <Flex mb={0}>
            <Link href="#" passHref>
              <Text as="a" fontSize="sm" color="teal.400" _hover={{ textDecoration: 'underline' }}>
                View Full Details →
              </Text>
            </Link>
          </Flex>
        </HStack>
        <Text fontWeight="light" color={textSub}>Description</Text>
        <Text fontWeight="medium" fontSize={"md"}>{project.description}</Text>
      </Box>
      {/* TABS */}
       {/* ←––––– YOUR “TABS” BAR –––––→ */}
      <HStack mb={4} gap={4}>
        <Button
          variant={activeTab === 'locations' ? 'solid' : 'ghost'}
          colorScheme="teal"
          onClick={() => setActiveTab('locations')}
        >
          Locations
        </Button>
        <Button
          variant={activeTab === 'sources' ? 'solid' : 'ghost'}
          colorScheme="teal"
          onClick={() => setActiveTab('sources')}
        >
          Sources
        </Button>
        <Button
          variant={activeTab === 'sensors' ? 'solid' : 'ghost'}
          colorScheme="teal"
          onClick={() => setActiveTab('sensors')}
        >
          Sensors
        </Button>
      </HStack>
      {/* ←––––– CONTENT PANELS –––––→ */}
      {activeTab === 'locations' && (
        <Box mb={6}>
          <Flex justify="space-between" mb={4}>
            <InputGroup maxW="300px">
              <Input placeholder="Search locations…" _placeholder={{ color: 'gray.500' }} />
            </InputGroup>
            <Button onClick={onLocOpen}>+ New Location</Button>
          </Flex>
          <LocationsList
            locations={initialLocations}
            projectId={project.id}
            onEdit={(loc) => { setSelectedLocation(loc); onLocOpen(); }}
            onDelete={(loc) => { setSelectedLocation(loc); onLocDelOpen(); }}
          />
        </Box>
      )}

      {activeTab === 'sources' && (
        <Box mb={6}>
          <Flex justify="space-between" mb={4}>
            <InputGroup maxW="300px">
              <Input placeholder="Search sources…" _placeholder={{ color: 'gray.500' }} />
            </InputGroup>
            <Button>+ New Source</Button>
          </Flex>
        </Box>
      )}

      {activeTab === 'sensors' && (
        <Box mb={6}>
          <Flex justify="space-between" mb={4}>
            <InputGroup maxW="300px">
              <Input placeholder="Search sensors…" _placeholder={{ color: 'gray.500' }} />
            </InputGroup>
            <Button>+ New Sensor</Button>
          </Flex>
        </Box>
      )}
      <HStack >
        <Flex wrap="wrap" gap={4} mb={4} w={"100%"} mr="auto" width="50%">
          {stats.map((s) => {
            if (Array.isArray(s.icons) && s.icons.length === 2) {
              const [UpIcon, DownIcon] = s.icons;
              return (
                <Link key={s.label} href={s.href || "#"} passHref style={{display: "contents"}}>
                  <Box
                    flex="1"
                    key={s.label}
                    bg={cardBg}
                    p={4}
                    borderRadius="md"
                    boxShadow="sm"
                    _hover={{ boxShadow: "md" }}
                  >
                    <HStack gap="5%">
                      {/* Up arrow + active count */}
                      <HStack gap="1">
                        <UpIcon size={24} weight="bold" color="green" />
                        <Text fontSize="xl" fontWeight="bold" color={textSub}>
                          {s.activeCount}
                        </Text>
                      </HStack>
                      {/* Down arrow + inactive count */}
                      <HStack gap="1">
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
            const IconComp = s.icons[0];
            // single-icon fallback
            return (
              <Link key={s.label} href={s.href || "#"} passHref style={{display: "contents"}}>
                <Box
                  flex="1"
                  key={s.label}
                  bg={cardBg}
                  p={4}
                  borderRadius="md"
                  boxShadow="sm"
                  _hover={{ boxShadow: "md" }}
                >
                  <HStack gap="2">
                    <IconComp size={24} weight="bold"/>
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
        </Flex>
      </HStack>
      {/* Filters + New Location */}
      <Box p={4} mb={6} className="c-card shadow-md">
        <Flex align="center" justify="center">
          <Tabs variant="line" colorScheme="teal" flex="1">
            <TabList justifySelf="center" gap={8}>
              {['All Locations', 'Active Locations', 'Inactive Locations'].map(
                (label) => (
                  <Tab
                    key={label}
                    cursor="pointer"
                    _selected={{ borderBottom: "2px solid" }}
                    _hover={{ borderBottom: "1px solid" }}
                  >
                    {label}
                  </Tab>
                )
              )}
            </TabList>
          </Tabs>

          <InputGroup maxW="300px" mr="12">
            <Input placeholder="Search locations..." _placeholder={{ color: "gray.500" }} cursor="text" _hover={{ bg: "whiteAlpha.100" }} className="c-card shadow-md" />
          </InputGroup>

        </Flex>
      </Box>

      <Flex justify="flex-end" mr="12">
        <Button
          m="2"
          mt="0"
          background="white"
          color="black"
          className="c-card shadow-md"
          _dark={{background: "black", color: "white"}}
          
          onClick={onLocOpen}
        >
          + New Location
        </Button>
      </Flex>
      {/* Table Header */}
      <Box
        bg="whiteAlpha.50"
        py={4}
        px={6}
        className="c-card shadow-md"
      >
        <Flex>
          <Box flex="1">
            <Flex>
              <Box flex="5">
                <Text fontWeight="bold">Monitoring Location</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Latitude</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Longitude</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Frequency</Text>
              </Box>
              <Box flex="1" textAlign="center" pr={4}>
                <Text fontWeight="bold">Active</Text>
              </Box>
            </Flex>
          </Box>
          <Box flex="0 0 auto" textAlign="center" w={20}><Text fontWeight="bold">Actions</Text></Box>
        </Flex>
      </Box>

      {/* Location Rows */}
      <LocationsList
        locations={initialLocations}
        projectId={project.id}
        onEdit={(loc) => {
          setSelectedLocation(loc);
          onLocOpen();
        }}
        onDelete={(loc) => {
          setSelectedLocation(loc);
          onLocDelOpen();
        }}
      />

      {/* Wizards */}
      <ProjectCreateModal
        isOpen={projOpen}
        onClose={() => {
          setSelectedProject(undefined);
          onProjClose();
        }}
        project={selectedProject}
      />

      <DeleteProjectDialog
        isOpen={delOpen}
        onClose={onDeleteClose}
        project={project}
      />

      <CreateLocationWizard
        isOpen={locOpen}
        onClose={() => {
          setSelectedLocation(undefined);
          onLocClose();
        }}
        projectId={project.id}
        location={selectedLocation}
      />

    <LocationDeleteModal
      isOpen={locDelOpen}
      onClose={() => {
        setSelectedLocation(undefined);
        onLocDelClose();
      }}
      location={selectedLocation}
    />
      
    </Box>
  );
}
