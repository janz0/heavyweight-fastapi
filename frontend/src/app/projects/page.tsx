// File: app/projects/page.tsx
"use client";

// React + Next Imports
import { useState, useEffect } from "react";

// Chakra Imports + Icons
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";

// UI Components
import ProjectsPageClient from "./ProjectsPageClient";

// Services + Types
import { useAuth } from "@/lib/auth";
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const { authToken } = useAuth();
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;
    listProjects(authToken)
      .then((data) => setProjects(data))
      .catch((e) => setError(e instanceof Error ? e.message: String(e)));
  }, [authToken]);

  if (!projects && !error) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6} bg={bg} color="red.500">
        Error loading Projects: {error}
      </Box>
    );
  }

  return <ProjectsPageClient projects={projects!} authToken={authToken!}/>;
}
