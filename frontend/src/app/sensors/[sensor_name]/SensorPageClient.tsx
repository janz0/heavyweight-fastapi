"use client";

import React from 'react';
import { Box, Button, HStack, Heading, Text, VStack } from '@chakra-ui/react';
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
          { label: 'Sensors', href: '/Sensors' },
          { label: `${sensor.sensor_name}`, href: `/Sensors/${sensor.sensor_name}` },
        ]}
      />
      <Box w="100%" gap="4" mb="4">
        {/* Metrics */}
        <Box mb={3} border="inset" borderRadius="xl" p="12px" h="full" alignItems="center" justifyItems={"center"}>
          {/* Title */}
            <Heading size="3xl">{sensor.sensor_name}</Heading>
        </Box>
      </Box>
      <HStack mb={3} h="50vh" align="stretch">
        <VStack w="40%" h="fit-content">
          <Box border="inset" borderRadius="xl" p="12px" w="100%">
            {/* Project Details */}
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Sensor Type:</Text>
              <Text fontWeight="medium">{sensor.sensor_type ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Sensor Group:</Text>
              <Text fontWeight="medium">{sensor.sensor_group_id ?? "N/A"}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="light" color={textSub}>Source Name:</Text>
              <Text fontWeight="medium">{sensor.details?.mon_source_name ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Created:</Text>
              <Text fontWeight="medium">{formatDate(sensor.created_at) ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Updated:</Text>
              <Text fontWeight="medium">{formatDate(sensor.last_updated)}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Active:</Text>
              <Text fontWeight="medium">Active (Placeholder)</Text>
            </HStack>
          </Box>
          <Button
            variant='solid'
            borderWidth={"2px"}
            borderColor={"black"}
            borderRadius={"xl"}
            border="inset"
            _dark={{borderColor: "white"}}
            w="100%"
            fontSize={"xl"}
          >
            Sensors
          </Button>
        </VStack>
      </HStack>
    </Box>
  );
}
