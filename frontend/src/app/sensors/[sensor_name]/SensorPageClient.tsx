"use client";

import React from 'react';
import { Box, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import type { MonitoringSensor } from '@/types/sensor';

interface SensorPageClientProps {
  sensor: MonitoringSensor;
}

// Utility to format ISO date strings to "Month day, year"
function formatDate(dateString?: string | null) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function SensorPageClient({ sensor }: SensorPageClientProps) {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';

  return (
    <Box minH="100vh" p={6} bg={bg}>
      <Breadcrumb
        crumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Projects', href: '/projects' },
        ]}
      />
      <Box display="grid" gridTemplateColumns="3fr 2fr" w="100%" gap="4" mb="4">
        {/* Metrics */}
        <Box mb={3} border="inset" borderRadius="xl" p="12px" h="full">
          {/* Title */}
          <HStack align="center" gap="2">
            <Heading size="3xl">{sensor.sensor_name}</Heading>
          </HStack>

          {/* Project Details */}
          <HStack justify="space-between" mr="25%" mt="2px">
            <VStack align="start" gap={0}>
              <Text fontWeight="light" color={textSub}>Sensor Type</Text>
              <Text fontWeight="medium">{sensor.sensor_type}</Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontWeight="light" color={textSub}>Source</Text>
              <Text fontWeight="medium">{sensor.details?.mon_source_name}</Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontWeight="light" color={textSub}>Sensor Group</Text>
              <Text fontWeight="medium">{sensor.sensor_group_id ?? "N/A"}</Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontWeight="light" color={textSub}>Created At</Text>
              <Text fontWeight="medium">{formatDate(sensor.created_at)}</Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontWeight="light" color={textSub}>Updated</Text>
              <Text fontWeight="medium">{formatDate(sensor.last_updated)}</Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontWeight="light" color={textSub}>Active</Text>
              <Text fontWeight="medium">Active (Placeholder)</Text>
            </VStack>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
}
