// File: app/sources/page.tsx
"use client";

// React + Next Imports
import { useState, useEffect } from "react";

// Chakra Imports + Icons
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";

// UI Components
import SourcesPageClient from "./SourcesPageClient";

// Sources Components
import { listSources } from "@/services/sources";
import type { Source } from "@/types/source";

export default function SourcesPage() {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  const [sources, setSources] = useState<Source[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSources()
      .then((data) => setSources(data))
      .catch((e) => setError(e instanceof Error ? e.message: String(e)));
  }, []);

  if (!sources && !error) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6} bg={bg} color="red.500">
        Error loading Sources: {error}
      </Box>
    );
  }

  return <SourcesPageClient sources={sources!} />;
}