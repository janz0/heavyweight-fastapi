// File: app/projects/ProjectsPageClient.tsx
"use client";

import { useEffect, useState } from "react";

import { ProjectsBreadcrumb } from "@/app/components/ProjectsBreadcrumb";
import ProjectsListClient from "@/app/components/ProjectsListClient";
import { CreateProjectWizard } from "@/app/components/CreateProjectWizard";
import { DeleteProjectDialog } from "@/app/components/DeleteProjectDialog";
import { toaster } from "@/components/ui/toaster";
import { Box, Button, Flex, Heading, InputGroup, Input, Skeleton, Text, VStack, useDisclosure } from "@chakra-ui/react";
import { Tabs, TabList, Tab } from "@chakra-ui/tabs";
import { PushPinSimple } from "phosphor-react";

import type { Project } from "@/types/project";

interface Props {
  projects: Project[];
}

export default function ProjectsPageClient({ projects }: Props) {
  // State to detect hydration
  const [ hydrated, setHydrated ] = useState(false);

  // Create/Edit wizard
  const [ selectedProject, setSelectedProject ] = useState<Project | undefined>(
    undefined
  );
  const { open: isCEOpen, onOpen: openCE, onClose: closeCE } = useDisclosure();

  // Delete confirmation
  const [ toDelete, setToDelete ] = useState<Project>();
  const { open: isDelOpen, onOpen: openDel, onClose: closeDel } = useDisclosure();

  // On mount, mark hydrated + defer showing the “Projects loaded” toast
  useEffect(() => {
    setHydrated(true);

    // Defer the toast into a microtask so we don’t flush during render:
    Promise.resolve().then(() => {
      toaster.create({
        description: "Projects loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  // Handlers for New, Edit, Delete:
  const handleNew = () => {
    setSelectedProject(undefined);
    openCE();
  };
  const handleEdit = (proj: Project) => {
    setSelectedProject(proj);
    openCE();
  };
  const handleDelete = (p: Project) => {
    setToDelete(p);
    openDel();
  };

  // 4) Render the UI
  return (
    <Box px={6} py={4}>
      <ProjectsBreadcrumb />

      {/* Pinned Projects Section */}
      <Box p={6} mb={6} className="c-card shadow-md">
        <Flex align="center" mb={4}>
          <PushPinSimple size={20} weight="fill" color="yellow" />
          <Heading as="h2" size="lg" ml={2}>
            Pinned Projects
          </Heading>
        </Flex>
        {/* Example pinned project card */}
        <Box className="info-card shadow-md">
          <Text>Project Alpha</Text>
        </Box>
      </Box>

      {/* Filters + New Project */}
      <Box p={4} mb={6} className="c-card shadow-md">
        <Flex align="center" justify="center" gap={12}>
          <Tabs variant="line" colorScheme="teal">
            <TabList justifySelf="center" gap={8}>
              {["All Projects", "Active Projects", "Inactive Projects"].map(
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

          <InputGroup justifySelf="end" maxW="300px">
            <Input placeholder="Search projects..." _placeholder={{ color: "gray.500" }} cursor="text" _hover={{ bg: "whiteAlpha.100" }} className="c-card shadow-md" />
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
          
          onClick={handleNew}
        >
          + New Project
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
                <Text fontWeight="bold">Project</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Start Date</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">End Date</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Locations</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Status</Text>
              </Box>
            </Flex>
          </Box>
          <Box flex="0 0 auto" textAlign="center" w={20}>
            <Text fontWeight="bold">Actions</Text>
          </Box>
        </Flex>
      </Box>

      {/* Project Rows */}
      {/* skeletons while we’re hydrating */}
      {!hydrated ? (
        <VStack gap={2} mt={2}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="72px" width="100%" borderRadius="md" />
          ))}
        </VStack>
      ) : (
        <ProjectsListClient
          initialProjects={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <CreateProjectWizard
        isOpen={isCEOpen}
        project={selectedProject}
        onClose={() => {
          setSelectedProject(undefined);
          closeCE();
        }}
      />
      <DeleteProjectDialog
        isOpen={isDelOpen}
        onClose={() => {
          setToDelete(undefined);
          closeDel();
        }}
        project={toDelete}
      />
    </Box>
  );
}
