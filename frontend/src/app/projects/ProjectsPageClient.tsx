// File: app/projects/components/ProjectsPageClient.tsx
"use client";

// React + Next Imports
import { useEffect, useState } from "react";

// Chakra Imports + Icons
import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import DataTable from "@/app/components/DataTable";

// Services + Types
import { ProjectCreateModal, ProjectDeleteModal, ProjectEditModal, ProjectDuplicateModal } from "../components/Modals/ProjectModals";
import type { Project } from "@/types/project";
import { projectColumns } from "@/types/columns";

import { PencilSimple, Plus, Trash, Copy } from "phosphor-react";

interface Props {
  projects: Project[];
}

export default function ProjectsPageClient({ projects: initialProjects }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Project[]>(initialProjects);

  // Colors
  const color   = "orange.600";
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Hydration
  useEffect(() => {
    setHydrated(true);
    Promise.resolve().then(() => {
      toaster.create({
        description: "Projects loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      {hydrated? (
        <DataTable columns={projectColumns} color={color} data={items} name="projects"
          createElement={
            <ProjectCreateModal
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setItems(prev => [created, ...prev]);
              }}
            />
          }
          editElement={(item) => (
            <ProjectEditModal project={item}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setItems(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
              }}
            />
          )}
          deleteElement={(item) => (
            <ProjectDeleteModal project={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Trash />
                </Button>
              }
              onDeleted={(id) => {
                setItems(prev => prev.filter(p => p.id !== id));
              }}
            />
          )}
          duplicateElement={(item) => (
            <ProjectDuplicateModal project={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Copy />
                </Button>
              }
              onDuplicated={(duplicated) => {
                setItems(prev => [duplicated, ...prev]);
              }}
            />
          )}
        />
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
    </Box>
  );
}
