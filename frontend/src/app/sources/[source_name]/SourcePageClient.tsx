"use client";

import React from 'react';
import { Box, HStack, Heading, Tabs, Text, VStack, Button } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import type { Source } from '@/types/source';

interface SourcePageClientProps {
  source: Source;
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

export default function SourcePageClient({ source }: SourcePageClientProps) {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';

  return (
    <Box minH="100vh" p={6} bg={bg}>
      <Breadcrumb
        crumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sources', href: '/sources' },
          { label: `${source.source_name}`, href: `/sources/${source.source_name}` },
        ]}
      />
      <Box w="100%" gap="4" mb="4">
        {/* Metrics */}
        <Box mb={3} border="inset" borderRadius="xl" p="12px" h="full" alignItems="center" justifyItems={"center"}>
          {/* Title */}
            <Heading size="3xl">{source.source_name}</Heading>
        </Box>
      </Box>
      <HStack mb={3} h="50vh" align="stretch">
        <VStack w="40%" h="fit-content">
          <Box border="inset" borderRadius="xl" p="12px" w="100%">
            {/* Project Details */}
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Project Name:</Text>
              <Text fontWeight="medium">{source.details?.project_name ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Location Name:</Text>
              <Text fontWeight="medium">{source.details?.loc_name ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Folder Path:</Text>
              <Text fontWeight="medium">{source.folder_path}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>File Keyword:</Text>
              <Text fontWeight="medium">{source.file_keyword}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>FileType:</Text>
              <Text fontWeight="medium">{source.file_type}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Source Type:</Text>
              <Text fontWeight="medium">{source.source_type}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Config:</Text>
              <Text fontWeight="medium">{source.config}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Data Upload:</Text>
              <Text fontWeight="medium">{formatDate(source.last_data_upload) ?? "N/A"}</Text>
            </HStack>
            <HStack align="start" gap={4}>
              <Text fontWeight="light" color={textSub}>Updated:</Text>
              <Text fontWeight="medium">{formatDate(source.last_updated)}</Text>
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
        <Tabs.Root defaultValue="map" orientation="horizontal" h="full" w="full" >
          <Box border="inset" borderRadius="xl" overflow="hidden" h="full" w="full">
            <Tabs.List>
              <Tabs.Trigger value="map">Sensors</Tabs.Trigger>
              <Tabs.Trigger value="chart">Chart</Tabs.Trigger>
              <Tabs.Trigger value="alerts">Alerts</Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
            <Tabs.Content value="map" h="calc(100% - 40px)" p="0">
            </Tabs.Content>
            <Tabs.Content value="chart">
              <Box h="full">
                {/* Chart placeholder */}
                <Text>📈 Chart view coming soon</Text>
              </Box>
            </Tabs.Content>
            <Tabs.Content value="alerts">
              <Box h="full">
                {/* Alerts placeholder */}
                <Text>🚨 Alerts view coming soon</Text>
              </Box>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </HStack>
    </Box>
  );
}
