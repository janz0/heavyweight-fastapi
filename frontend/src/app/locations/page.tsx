// File: app/locations/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";
import LocationsPageClient from "./LocationsPageClient";
import { listLocations } from "@/services/locations";
import type { Location } from "@/types/location";
import { CreateLocationWizard } from "../components/CreateLocationWizard";

export default function SensorsPage() {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const text = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  const [locations, setLocations] = useState<Location[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isWizardOpen, setWizardOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>(undefined);

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

  return (
    <Box bg={bg} color={text} minH="100vh">
      <LocationsPageClient
        locations={locations!}
        onEdit={(location) => {
          setEditingLocation(location);
          setWizardOpen(true);
        }}
      />

      <CreateLocationWizard
        isOpen={isWizardOpen}
        location={editingLocation}
        onClose={() => {
          setWizardOpen(false);
          setEditingLocation(undefined);
        }}
      />
    </Box>
  );
}
