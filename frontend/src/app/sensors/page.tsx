// File: app/sensors/page.tsx
"use client";

// React + Next Imports
import { useState, useEffect } from "react";

// Chakra Imports + Icons
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";

// UI Components
import SensorsPageClient from "./SensorsPageClient";

// Services + Types
import { useAuth } from "@/lib/auth";
import { listSensors } from "@/services/sensors";
import type { MonitoringSensor } from "@/types/sensor";

export default function SensorsPage() {
  const { authToken } = useAuth();
  const { colorMode } = useColorMode();
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  const [sensors, setSensors] = useState<MonitoringSensor[] | null>(null);

  const [error, setError] = useState<string | null>(null);

  // fetch sensors on mount
  useEffect(() => {
    listSensors(authToken)
      .then((data) => setSensors(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [authToken]);

  // Loading state
  if (!sensors && !error) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={"inherit"}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={6} bg={"inherit"} color="red.500">
        Error loading sensors: {error}
      </Box>
    );
  }

  return <SensorsPageClient sensors={sensors!} authToken={authToken!} />;
}
