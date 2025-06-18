"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { useColorMode } from "../src/components/ui/color-mode";
import SensorsPageClient from "./SensorsPageClient";
import { listSensors } from "@/services/sensors";
import type { MonitoringSensor } from "@/types/sensor";
import { CreateSensorWizard } from "@/app/components/CreateSensorWizard";

export default function SensorsPage() {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const text = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  const [sensors, setSensors] = useState<MonitoringSensor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for edit‐wizard
  const [isWizardOpen, setWizardOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<MonitoringSensor | undefined>(undefined);

  // fetch sensors on mount
  useEffect(() => {
    listSensors()
      .then((data) => setSensors(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Loading state
  if (!sensors && !error) {
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
        Error loading sensors: {error}
      </Box>
    );
  }

  return (
    <Box bg={bg} color={text} minH="100vh">
      <SensorsPageClient
        sensors={sensors!}
        onEdit={(sensor) => {
          setEditingSensor(sensor);
          setWizardOpen(true);
        }}
        onCreate={() => {
          setEditingSensor(undefined);
          setWizardOpen(true);
        }}
      />

      <CreateSensorWizard
        isOpen={isWizardOpen}
        sensor={editingSensor}
        onClose={() => {
          setWizardOpen(false);
          setEditingSensor(undefined);
        }}
      />
    </Box>
  );
}
