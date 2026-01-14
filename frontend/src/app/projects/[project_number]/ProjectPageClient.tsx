// File: app/projects/[project_number]/ProjectsPageClient.tsx
'use client';

import React, { useState } from 'react';
import { Box, Button, Flex, Heading, IconButton, Popover, Text, VStack, HStack, SimpleGrid, Separator } from '@chakra-ui/react';
import type { Project } from '@/types/project';
import Link from 'next/link';
import { Bell, ArrowCircleUp, ArrowCircleDown } from "phosphor-react";
import { useColorMode } from '@/app/src/components/ui/color-mode';
import DataTable from "@/app/components/DataTable";
import { PencilSimple, Trash, Plus, Copy, DotsThreeVertical } from "phosphor-react";

// Services + Types
import { ProjectEditModal, ProjectDeleteModal } from '@/app/components/Modals/ProjectModals';
import { SourceCreateModal, SourceEditModal, SourceDeleteModal, SourceDuplicateModal } from '@/app/components/Modals/SourceModals';
import { Source } from '@/types/source';
import { MonitoringSensor } from '@/types/sensor';
import { SensorCreateModal, SensorEditModal, SensorDeleteModal, SensorDuplicateModal } from '@/app/components/Modals/SensorModals';
import { LocationCreateModal, LocationDeleteModal, LocationEditModal, LocationDuplicateModal } from '@/app/components/Modals/LocationModals';
import { Location } from '@/types/location';
import { locationColumns, sourcesColumns, sensorColumns } from '@/types/columns';

interface Props {
  initialProject: Project;
  initialLocations: Location[];
  initialSources: Source[];
  initialSensors: MonitoringSensor[];
  authToken: string;
}

export default function ProjectsPageClient({ initialProject, initialLocations, initialSources, initialSensors, authToken }: Props) {
  const { colorMode } = useColorMode();
  const [activeTab, setActiveTab] = useState<'locations'|'sources'|'sensors'>('locations');
  const [project, setProject] = useState<Project>(initialProject);
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [sensors, setSensors] = useState<MonitoringSensor[]>(initialSensors);

  // derive theme tokens
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';

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
    { label: "Alerts", href: "/", value: 2, icons: [Bell, ] as const, },
  ];
  const TYPE_COLORS: Record<string,string> = {
    "Locations": "blue.600",
    "Sensors":  "green.600",
    "Sources":  "purple.600",
  };

  function formatDate(dateString?: string | null) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day:   'numeric',
      year:  'numeric',
    }).format(date);
  }

  function formatShortDate(dateString?: string | null) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}
  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      <Flex mb={4} position="relative" direction="column">
        <Heading fontSize="3xl">
          <Text as="span" fontSize={{base:"md",md:"2xl"}}>
            {project.project_name}
          </Text>
          <Text as="span" ml={2} fontSize={{base:"xs",md:"sm",lg:"md"}} fontWeight={"extralight"}>
            {project.project_number}
          </Text>
          <Box
            display="inline-block"
            boxSize={{base: "6px", md:"12px"}}
            borderRadius="full"
            ml="2"
            bg={project.active ? "green.400" : "red.400"}
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
                  <Popover.Body height="100px" p={0}>
                    <VStack gap={0} justifyContent={"center"} height="inherit">
                      <ProjectEditModal project={project}
                        trigger={
                          <Button variant="ghost" size="md">
                            <PencilSimple />
                          </Button>
                        }
                        onEdited={(edited) => {
                          setProject(edited);
                        }}
                        authToken={authToken}
                      />
                      <ProjectDeleteModal project={project}
                        trigger={
                          <Button variant="ghost" size="md">
                            <Trash />
                          </Button>
                        }
                        authToken={authToken}
                      />
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          </Box>
        </Heading>
        <Text fontSize={{base:"sm", md: "md"}}>
          {project.description}
        </Text>
        <Text position="absolute" left="50%" transform="translateX(-50%)" textAlign={"center"} display={{base: "none", lg:"initial"}}>
          {formatDate(project.start_date)} - {formatDate(project.end_date)}
        </Text>
        <VStack position="absolute" right="0" align="flex-end" fontSize={{base:"xs", md:"sm"}} gap="0">
          <Text display={{base: "block", sm:"none"}}>
            {formatShortDate(project.start_date)} - {formatShortDate(project.end_date)}
          </Text>
          <Text display={{base: "none", sm: "block", lg:"none"}}>
            {formatDate(project.start_date)} - {formatDate(project.end_date)}
          </Text>
          <Text fontSize={{base:"xs", md:"md"}}>
            Last Updated: {formatShortDate(project.last_updated)}
          </Text>
        </VStack>

      </Flex>
      <Flex mb={3} direction={{base: "column", md: "row"}} gap={2}>
        <SimpleGrid columns={{ base: 1, md: 2}} gap={{base: "2", md:"4"}} alignSelf={"center"} whiteSpace={"nowrap"} w={{base: "full", md: "55%"}} className="bg-card">
          {stats.map(s => {
            const color = TYPE_COLORS[s.label] ?? text;
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
                    key={s.label}
                    borderLeftColor={color}
                    className="d-card"
                  >
                    <HStack align="center" justifyContent={"space-between"}>
                      <HStack mr="auto" justifyContent={"space-between"}>
                        <HStack >
                          <UpIcon size={24} weight="bold" color="green" />
                          <Text fontSize={{base: "md", md: "xl"}} flexShrink={0} fontWeight="bold" color={textSub}>
                            {s.activeCount}
                          </Text>
                        </HStack>
                        <HStack>
                          <DownIcon size={24} weight="bold" color="red" />
                          <Text fontSize={{base: "md", md: "xl"}} flexShrink={0} fontWeight="bold" color={textSub}>
                            {s.inactiveCount}
                          </Text>
                        </HStack>
                      </HStack>
                      <Text display="inline-flex" fontSize="clamp(0.75rem, 2.5vw, 1rem)" className="text-color" flexShrink={1} truncate alignItems={"center"} justifyContent="center">
                        {s.label}
                      </Text>
                    </HStack>
                    <Box
                      as="div"
                      position="absolute"
                      bottom="0"
                      left="0"
                      width="100%"
                      height="20px"
                      opacity={0.3}
                      color={color}
                      pointerEvents="none"
                    >
                      <svg
                        viewBox="0 0 200 20"
                        preserveAspectRatio="none"
                        width="100%"
                        height="100%"
                      >
                        <path d="M0,0 C50,20 150,0 200,20 L200,20 L0,20 Z" fill="currentColor"/>
                      </svg>
                    </Box>
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
                    key={s.label}
                    flex="1"
                    borderLeftColor={color}
                    className="d-card"
                >
                  <HStack align="center" justifyContent={"space-between"}>
                    <HStack>
                      <IconComp size={24} weight="bold" />
                      <Text fontSize="xl" fontWeight="bold" color={textSub}>
                        {s.value}
                      </Text>
                    </HStack>
                    <Text display="inline-flex" fontSize="clamp(0.75rem, 2.5vw, 1rem)" className="text-color" flexShrink={1} truncate alignItems={"center"} justifyContent="center">
                      {s.label}
                    </Text>
                  </HStack>
                  <Box
                    as="div"
                    position="absolute"
                    bottom="0"
                    left="0"
                    width="100%"
                    height="20px"
                    opacity={0.3}
                    color={color}
                    pointerEvents="none"
                  >
                    <svg
                      viewBox="0 0 200 20"
                      preserveAspectRatio="none"
                      width="100%"
                      height="100%"
                    >
                      <path d="M0,0 C50,20 150,0 200,20 L200,20 L0,20 Z" fill="currentColor"/>
                    </svg>
                  </Box>
                </Box>
              </Link>
            );
          })}
        </SimpleGrid>
        <Box w="full" className="bg-card" alignSelf={"stretch"}></Box>
      </Flex>
      <Separator variant="solid" size="lg" marginY="6" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'} />
      <HStack mb={4} gap={4} justifyContent={"center"}>
        <Button
          variant={activeTab === 'locations' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab('locations')}
          borderColor={"blue.600"}
          bg={activeTab === 'locations' ? 'blackAlpha.200' : 'undefined'}
          color={"black"}
          _dark={{color: "gray.200", bg: `${activeTab === 'locations' ? 'whiteAlpha.300' : 'undefined'}`}}
          w="25%"
          className="bg-card"
        >
          Locations
        </Button>
        <Button
          variant={activeTab === 'sources' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab('sources')}
          borderWidth={"2px"}
          borderColor={"purple.600"}
          bg={activeTab === 'sources' ? 'blackAlpha.200' : 'undefined'}
          color={"black"}
          _dark={{color: "gray.200", bg: `${activeTab === 'sources' ? 'whiteAlpha.300' : 'undefined'}`}}
          w="25%"
        >
          Sources
        </Button>
        <Button
          variant={activeTab === 'sensors' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab('sensors')}
          borderWidth={"2px"}
          borderColor={"green.600"}
          bg={activeTab === 'sensors' ? 'blackAlpha.200' : 'undefined'}
          color={"black"}
          _dark={{color: "gray.200", bg: `${activeTab === 'sensors' ? 'whiteAlpha.300' : 'undefined'}`}}
          w="25%"
        >
          Sensors
        </Button>
      </HStack>

      {/* ←––––– CONTENT PANELS –––––→ */}
      {activeTab === 'locations' && (
        <DataTable columns={locationColumns} color={"blue.600"} data={locations} name={activeTab}
          createElement={
            <LocationCreateModal projectId={project.id}
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setLocations(prev => [created, ...prev]);
              }}
              authToken={authToken}
            />
          }
          editElement={(item) => (
            <LocationEditModal location={item} projectId={project.id}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setLocations(prev => prev.map(l => l.id === edited.id ? { ...l, ...edited } : l));
              }}
              authToken={authToken}
            />
          )}
          deleteElement={(item) => (
            <LocationDeleteModal location={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Trash />
                </Button>
              }
              onDeleted={(id) => {
                setLocations(prev => prev.filter(l => l.id !== id));
              }}
              authToken={authToken}
            />
          )}
          duplicateElement={(item) => (
            <LocationDuplicateModal location={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Copy />
                </Button>
              }
              onDuplicated={(duplicated) => {
                setLocations(prev => [duplicated, ...prev]);
              }}
              authToken={authToken}
            />
          )}
        />
      )}

      {activeTab === 'sources' && (
        <DataTable columns={sourcesColumns} color={"purple.600"} data={sources} name={activeTab}
          createElement={
            <SourceCreateModal projectId={project.id}
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setSources(prev => [created, ...prev]);
              }}
              authToken={authToken}
            />
          }
          editElement={(item) => (
            <SourceEditModal source={item} projectId={project.id}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setSources(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
              }}
              authToken={authToken}
            />
          )}
          deleteElement={(item) => (
            <SourceDeleteModal source={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Trash />
                </Button>
              }
              onDeleted={(id) => {
                setSources(prev => prev.filter(p => p.id !== id));
              }}
              authToken={authToken}
            />
          )}
          duplicateElement={(item) => (
            <SourceDuplicateModal source={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Copy />
                </Button>
              }
              onDuplicated={(duplicated) => {
                setSources(prev => [duplicated, ...prev]);
              }}
              authToken={authToken}
            />
          )}
        />
      )}

      {activeTab === 'sensors' && (
        <DataTable columns={sensorColumns} color={"green.600"} data={sensors} name={activeTab} 
          createElement={
            <SensorCreateModal projectId={project.id}
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setSensors(prev => [created, ...prev]);
              }}
              authToken={authToken}
            />
          }
          editElement={(item) => (
            <SensorEditModal sensor={item} projectId={project.id}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setSensors(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
              }}
              authToken={authToken}
            />
          )}
          deleteElement={(item) => (
            <SensorDeleteModal sensor={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Trash />
                </Button>
              }
              onDeleted={(id) => {
                setSensors(prev => prev.filter(p => p.id !== id));
              }}
              authToken={authToken}
            />
          )}
          duplicateElement={(item) => (
            <SensorDuplicateModal sensor={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Copy />
                </Button>
              }
              onDuplicated={(duplicated) => {
                setSensors(prev => [duplicated, ...prev]);
              }}
              authToken={authToken}
            />
          )}
        />
      )}
    </Box>
  );
}
