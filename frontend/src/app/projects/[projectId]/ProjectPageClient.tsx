// File: app/projects/[projectId]/ProjectsPageClient.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  InputGroup,
  Input,
  Button,
  useDisclosure,
  IconButton,
  Popover,
  VStack,
} from '@chakra-ui/react';
import {
  Tabs,
  TabList,
  Tab,
} from '@chakra-ui/tabs';
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { PushPinSimple } from 'phosphor-react';
import { ProjectsBreadcrumb } from '@/app/components/ProjectsBreadcrumb';
import { CreateProjectWizard } from '@/app/components/CreateProjectWizard';
import { CreateLocationWizard } from '@/app/components/CreateLocationWizard';
import { LocationsList } from '@/app/components/LocationsList';
import type { Project } from '@/types/project';
import type { Location } from '@/types/location';
import { DeleteProjectDialog } from '@/app/components/DeleteProjectDialog';
import { DeleteLocationDialog } from '@/app/components/DeleteLocationDialog';
import Link from 'next/link';

interface Props {
  project: Project;
  initialLocations: Location[];
}

export default function ProjectsPageClient({ project, initialLocations }: Props) {
  const { open: projOpen, onOpen: onProjOpen, onClose: onProjClose } = useDisclosure();
  const { open: locOpen, onOpen: onLocOpen, onClose: onLocClose } = useDisclosure();
  const { open: delOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { open: locDelOpen, onOpen: onLocDelOpen, onClose: onLocDelClose } = useDisclosure();

  const [selectedProject, setSelectedProject] = useState<Project | undefined>(project);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);

  const [openId, setOpenId] = useState<string | null>(null);
  const isOpen = openId === project.id;

  const handleEditProject = () => {
    setSelectedProject(project);
    onProjOpen();
  };

  const handleEditLocation = (loc: Location) => {
    setSelectedLocation(loc);
    onLocOpen();
  };

  return (
    <Box px={6} py={4}>
      <ProjectsBreadcrumb
        projectName={project.project_name}
        projectId={project.id}
      />

      {/* Project Header & Details */}
      <Box
        borderRadius="md"
        bg="whiteAlpha.50"
        boxShadow="0px 2px 4px rgba(0,255,255,0.7)"
        px={6}
        py={4}
        mb={3}
      >
        <Flex
          justify="space-between"
          align="center"
          mb={3}
          borderBottom="1px"
          borderColor="whiteAlpha.300"
        >
          <Heading size="2xl" flex="1">
            {project.project_name}
          </Heading>
          {/* grouped actions popover */}
          {/* grouped actions popover */}
          <Popover.Root open={isOpen} onOpenChange={(next) => setOpenId(next ? project.id : null)} positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}} closeOnEscape={false}>
            <Popover.Trigger asChild>
              <IconButton
                textAlign={"right"}
                verticalAlign={"center"}
                aria-label="More actions"
                variant="ghost"
                size="xs"
                color="white"
                borderRadius="lg"
                width={"auto"}
                _hover={{
                  backgroundColor: 'whiteAlpha.200',
                }}
              >
                <FiMoreVertical />
              </IconButton>
            </Popover.Trigger>

            <Popover.Positioner>
              <Popover.Content
                width="64px"
                height="100px"
                p={1}
                background={"gray.200"}
              >
                <Popover.Arrow>
                  <Popover.ArrowTip />
                </Popover.Arrow>
                <Popover.Body p={2}>
                  <VStack gap={1} align="stretch">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleEditProject();
                        setOpenId(null);
                      }}
                    ><FiEdit2 />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      colorScheme="red"
                      onClick={() => {
                        onDeleteOpen();
                        setOpenId(null);
                      }}
                    >
                      <FiTrash2 />
                    </Button>
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
        </Flex>

        <Flex justify="space-between" width="75%" mb={3} textAlign={"left"}>
          <Box>
            <Text fontSize="sm" color="gray.400">📅 Start Date</Text>
            <Text fontWeight="medium">{new Date(project.start_date).toLocaleDateString(undefined, {
                year:  'numeric',
                month: 'long',
                day:   'numeric',
              })}</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.400">📅 End Date</Text>
            <Text fontWeight="medium">{project.end_date ?? '-'}</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.400">🕒 Created At</Text>
            <Text fontWeight="medium">{new Date(project.created_at).toLocaleDateString(undefined, {
              year:  'numeric',
              month: 'long',
              day:   'numeric',
            })}</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.400">🔄 Last Updated</Text>
            <Text fontWeight="medium">{new Date(project.last_updated).toLocaleDateString(undefined, {
              year:  'numeric',
              month: 'long',
              day:   'numeric',
            })}</Text>
          </Box>
        </Flex>

        <Box width="75%">
          <Text fontSize="md" color="gray.400">📝 Description</Text>
          <Text fontWeight="medium">{project.description}</Text>
        </Box>

        <Flex justify="flex-end" mt={2}>
          <Link href="#" passHref>
            <Text as="a" fontSize="sm" color="teal.400" _hover={{ textDecoration: 'underline' }}>
              View Full Details →
            </Text>
          </Link>
        </Flex>
      </Box>

      {/* Pinned Locations Section */}
      <Box
        p={6}
        borderRadius="md"
        bg="whiteAlpha.50"
        boxShadow="0px 2px 4px rgba(0,255,255,0.7)"
        mb={6}
      >
        <Flex align="center" mb={4}>
          <PushPinSimple size={20} weight="fill" color="yellow" />
          <Heading as="h2" size="lg" ml={2}>
            Pinned Monitoring Locations
          </Heading>
        </Flex>
        {/* Example pinned location card */}
        <Box
          cursor="pointer"
          p={6}
          borderRadius="md"
          bg="whiteAlpha.50"
          boxShadow="0px 2px 4px rgba(0,255,255,0.7)"
          transition="all 0.2s"
          _hover={{ boxShadow: '0 4px 8px rgba(250,250,250,0.8)', transform: 'translateY(-2px)' }}
          _active={{ bg: 'whiteAlpha.800', boxShadow: '0 4px 8px rgba(255,255,255,0.4)' }}
        >
          <Text>Location A</Text>
        </Box>
      </Box>

      {/* Filters + New Location */}
      <Box
        bg="whiteAlpha.50"
        p={4}
        borderRadius="md"
        boxShadow="0px 2px 4px rgba(0,255,255,0.7)"
        mb={6}
      >
        <Flex align="center" justify="space-between">
          <Tabs variant="line" colorScheme="teal">
            <TabList gap={8}>
              {['All Locations', 'Active Locations', 'Inactive Locations'].map(label => (
                <Tab key={label}>{label}</Tab>
              ))}
            </TabList>
          </Tabs>
          <InputGroup maxW="300px">
            <Input
              placeholder="Search locations..."
              bg="white"
              _placeholder={{ color: 'gray.500' }}
            />
          </InputGroup>
          <Button onClick={onLocOpen} colorScheme="yellow">
            + New Location
          </Button>
        </Flex>
      </Box>

      {/* Table Header */}
      <Box
        bg="whiteAlpha.50"
        py={4}
        px={6}
        borderRadius="md"
        boxShadow="0px 2px 4px rgba(0,255,255,0.7)"
        mb={4}
      >
        <Flex>
          <Box flex="1">
            <Flex>
              <Box flex="5"><Text fontWeight="bold">Monitoring Location</Text></Box>
              <Box flex="1" textAlign="center"><Text fontWeight="bold">Latitude</Text></Box>
              <Box flex="1" textAlign="center"><Text fontWeight="bold">Longitude</Text></Box>
              <Box flex="1" textAlign="center"><Text fontWeight="bold">Frequency</Text></Box>
              <Box flex="1" textAlign="center" pr={4}><Text fontWeight="bold">Active</Text></Box>
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
      <CreateProjectWizard
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

    <DeleteLocationDialog
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
