// File: app/locations/page.tsx
"use client";

// React + Next Imports
import { useState, useEffect } from "react";

// Chakra Imports + Icons
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";

// UI Components
import LocationsPageClient from "./components/LocationsPageClient";

// Services + Types
import { listLocations } from "@/services/locations";
import type { Location } from "@/types/location";

export default function LocationsPage() {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  const [locations, setLocations] = useState<Location[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listLocations()
      .then((data) => setLocations(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Loading state
  if (!locations && !error) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={6} bg={bg} color="red.500">
        Error loading locations: {error}
      </Box>
    );
  }
  
  return <LocationsPageClient locations={locations!} />;
}
