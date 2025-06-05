// File: app/projects/ProjectsPageClient.tsx
"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  InputGroup,
  Input,
  Button,
  VStack,
  Skeleton,
  useDisclosure,
} from "@chakra-ui/react";
import { Tabs, TabList, Tab } from "@chakra-ui/tabs";
import { PushPinSimple } from "phosphor-react";
import { ProjectsBreadcrumb } from "@/app/components/ProjectsBreadcrumb";
import ProjectsListClient from "@/app/components/ProjectsListClient";
import { CreateProjectWizard } from "@/app/components/CreateProjectWizard";
import { DeleteProjectDialog } from "@/app/components/DeleteProjectDialog";
import { useEffect, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import type { Project } from "@/types/project";

interface Props {
  projects: Project[];
}

export default function ProjectsPageClient({ projects }: Props) {
  // 1) Always declare hooks at the top:
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

  // 2) On mount, mark hydrated + defer showing the “Projects loaded” toast
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

  // 3) Handlers for New, Edit, Delete:
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
      <Box
        p={6}
        borderRadius="md"
        bg="whiteAlpha.50"
        boxShadow="0px 2px 4px 0px rgba(0, 255, 255, 0.7)"
        transition="all 0.2s"
        mb={6}
      >
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
      <Box
        bg="whiteAlpha.50"
        p={4}
        borderRadius="md"
        boxShadow="0px 2px 4px 0px rgba(0, 255, 255, 0.7)"
        mb={6}
      >
        <Flex align="center" justify="center" gap={12}>
          <Tabs variant="line" colorScheme="teal">
            <TabList justifySelf="center" gap={8}>
              {["All Projects", "Active Projects", "Inactive Projects"].map(
                (label) => (
                  <Tab
                    key={label}
                    cursor="pointer"
                    fontWeight="medium"
                    px={0}
                    _selected={{ color: "teal.500", borderBottom: "2px solid" }}
                    _hover={{ color: "teal.600" }}
                  >
                    {label}
                  </Tab>
                )
              )}
            </TabList>
          </Tabs>

          <InputGroup justifySelf="end" maxW="300px">
            <Input
              placeholder="Search projects..."
              bg="white"
              _placeholder={{ color: "gray.500" }}
              cursor="text"
              _hover={{ bg: "whiteAlpha.100" }}
            />
          </InputGroup>
        </Flex>
      </Box>

      <Flex justify="flex-end" mr="12">
        <Button
          ml="auto"
          mr="5"
          borderTopLeftRadius="md"
          borderTopRightRadius="md"
          onClick={handleNew}
          boxShadow={"0px -3px 4px 0px rgba(0, 255, 255, 0.7)"}
        >
          + New Project
        </Button>
      </Flex>

      {/* Table Header */}
      <Box
        bg="whiteAlpha.50"
        py={4}
        px={6}
        borderRadius="md"
        boxShadow="0px 2px 4px 0px rgba(0, 255, 255, 0.7)"
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
