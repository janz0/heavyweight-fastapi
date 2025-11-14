// File: app/projects/components/ProjectsPageClient.tsx
"use client";

// React + Next Imports
import { useEffect, useState } from "react";

// Chakra Imports + Icons
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import DataTable from "@/app/components/DataTable";

// Services + Types
import { ProjectCreateModal, ProjectDeleteModal, ProjectEditModal, ProjectDuplicateModal } from "../components/Modals/ProjectModals";
import type { Project } from "@/types/project";
import { projectColumns } from "@/types/columns";

interface Props {
  projects: Project[];
}

export default function ProjectsPageClient({ projects: initialProjects }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Project[]>(initialProjects);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [isDupOpen, setDupOpen] = useState(false);
  const [duplicateProject, setDuplicateProject] = useState<Project | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [toDelete, setToDelete] = useState<Project | undefined>();

  // Colors
  const color   = "orange.600";
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Handlers
  const handleNew = () => { setSelectedProject(undefined); setCreateOpen(true); };
  const handleEdit = (p: Project) => { setSelectedProject(p); setEditOpen(true); };
  const handleDelete = (p: Project) => { setToDelete(p); setDelOpen(true); };
  const handleDuplicate = (p: Project) => {setDuplicateProject(p); setDupOpen(true); };

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
        <DataTable columns={projectColumns} color={color} data={items} onCreate={handleNew} onEdit={handleEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} name="projects" />
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
      <ProjectCreateModal 
        isOpen={isCreateOpen} 
        onClose={() => { setSelectedProject(undefined); setCreateOpen(false);}}
        onCreated={(created) => {
          setItems(prev => [created, ...prev]);
        }}
      />
      <ProjectEditModal
        isOpen={isEditOpen}
        project={selectedProject}
        onClose={() => { setSelectedProject(undefined); setEditOpen(false); }}
        onEdited={(edited) => {
          setItems(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
        }}
      />
      <ProjectDeleteModal
        isOpen={isDelOpen}
        project={toDelete}
        onClose={() => { setToDelete(undefined); setDelOpen(false);}}
        onDeleted={(id) => {
          setItems(prev => prev.filter(p => p.id !== id));
        }}
      />
      <ProjectDuplicateModal
        isOpen={isDupOpen}
        project={duplicateProject}
        onClose={() => { setDuplicateProject(undefined); setDupOpen(false); }}
        onDuplicated={(duplicated) => {
          setItems(prev => [duplicated, ...prev]);
        }}
      />
    </Box>
  );
}
