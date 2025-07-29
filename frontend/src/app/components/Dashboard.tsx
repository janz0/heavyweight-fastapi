// File: app/components/Dashboard.tsx
"use client";

import { Heading, Box, Flex, Text, VStack, SimpleGrid, Spinner, HStack, useBreakpointValue } from "@chakra-ui/react";
import { Line } from "react-chartjs-2";
import { Info, Folder, MapPin, Gauge, Database } from "phosphor-react";
import Link from "next/link";
import { Tooltip } from "@/app/src/components/ui/tooltip";
import { useColorMode } from "../src/components/ui/color-mode";
import { useAuth } from "@/lib/auth";

export interface DashboardProps {
  loading: boolean;
  activeProjects: number;
  totalProjects: number;
  totalLocations: number;
  onlineSensors: number;
  totalSources: number;
}

export default function Dashboard({
  loading,
  activeProjects,
  totalProjects,
  totalLocations,
  onlineSensors,
  totalSources,
}: DashboardProps) {
  const { user } = useAuth();
  const firstName = user?.first_name ?? "there";
  const size = useBreakpointValue({ base: 16, md: 32 });
  
  const { colorMode } = useColorMode();
  const cardBg  = colorMode === 'light' ? 'gray.200' : '#2c2c2c';
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const accent  = colorMode === 'light' ? '#3B82F6' : '#60A5FA';
  const stats = [
    { label: 'Active Projects', labelShort: "Projects", value: activeProjects,  href: '/projects', icon: Folder },
    { label: 'Total Locations', labelShort: "Locations", value: totalLocations,  href: '/locations', icon: MapPin },
    { label: 'Online Sensors', labelShort: "Sensors", value: onlineSensors,   href: '/sensors',   icon: Gauge },
    { label: 'Sources', labelShort: "Sources", value: totalSources,    href: '/sources',   icon: Database },
  ];
  
  const TYPE_COLORS: Record<string,string> = {
    "Active Projects": "orange.600",
    "Total Locations": "blue.600",
    "Online Sensors":  "green.600",
    "Sources":         "purple.600",
  };
  
  // chart data remains static here
  const chartData = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
    datasets: [{
      data: [30,45,28,50,42,60,55],
      fill: false,
      tension: 0.4,
      // you can pass colors in as props if you like
      borderColor: '#3B82F6',
      pointBackgroundColor: '#3B82F6',
    }],
  };

  if (loading) {
    return (
      <Flex h="60vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      <VStack align="start" gap={1} mb={{base: "2", md: "4"}} alignItems={{base: "center", md: "normal"}}>
        <Heading size={{base: "sm", md: "md"}}>Welcome <Text as="span" color="blue">{firstName}</Text>!</Heading>
      </VStack>
      {/* Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4}} gap={{base: "2", md:"4"}} mb={4} pr={2} maxW={{base: "full", md: "breakpoint-xl"}} whiteSpace={"nowrap"}>
        {stats.map(s => {
          const IconComp = s.icon;
          const color = TYPE_COLORS[s.label] ?? text;
          let label;
          if (size == 32) label = s.label; else label = s.labelShort
          return (
            <Link key={s.label} href={s.href || '#'} passHref style={{display: "contents"}}>
              <Box
                key={s.label}
                flex="1"
                borderLeft="4px solid"
                borderColor={color}
                bg={cardBg}
                position="relative"
                overflow="hidden"
                p={{base: "2", md: "4"}}
                borderRadius="md"
                boxShadow="sm"
                cursor="pointer"
                transition="transform 0.2s ease, box-shadow 0.2s ease, border-left-width 0.2s ease"
                _hover={{ transform: "translateY(-2px)", boxShadow: "lg", borderLeftWidth: "8px" }}
              >
                <HStack align="center" justify="space-between">
                  <HStack>
                    <IconComp size={size} weight="bold" color={accent}/>
                    <Text fontSize={{base: "md", md: "xl"}} flexShrink={0} fontWeight="bold" color={accent}>{s.value}</Text>
                  </HStack>
                  <HStack>
                    <Text display="inline-flex" fontSize="clamp(0.75rem, 2.5vw, 1rem)" color={textSub} flexShrink={1} truncate alignItems={"center"} justifyContent="center">
                      {label}
                      {s.label === 'Active Projects' && (
                        <Box ml={1}>
                          <Tooltip
                            content={`${activeProjects} active of ${totalProjects} total`}
                            showArrow
                            openDelay={100}
                            closeDelay={100}
                          >
                            <Info size={14} weight="bold" />
                          </Tooltip>
                        </Box>
                      )}
                    </Text>
                  </HStack>
                </HStack>
                <Box
                  as="div"
                  position="absolute"
                  bottom="0"
                  left="0"
                  width="100%"
                  height="20px"
                  opacity={0.1}
                  color={color}
                  pointerEvents="none"
                >
                  <svg
                    viewBox="0 0 200 20"
                    preserveAspectRatio="none"
                    width="100%"
                    height="100%"
                  >
                    <path d="M0,0 C50,20 150,0 200,20 L200,20 L0,20 Z" fill="currentColor"/>
                  </svg>
                </Box>
              </Box>
            </Link>
          );
        })}
      </SimpleGrid>

      {/* Main Chart & Side Panels */}
      <Flex direction={['column', 'column', 'row']} gap={6}>
        {/* Chart */}
        <Box bg={cardBg} p={4} borderRadius="md" boxShadow="sm" w="55%" h="fit-content">
          <Text fontSize="lg" mb={4}>Requests Per Second</Text>
          <Line data={chartData} options={{ maintainAspectRatio: true } } />
        </Box>

        {/* Alerts & Maintenance */}
        <Flex direction="column" gap={6}>
          <Box bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
            <Text fontSize="lg" mb={2}>Recent Alerts</Text>
            <VStack align="start" gap={1} color={textSub}>
              <Text>• Server CPU usage is high</Text>
              <Text>• Database response time is slow</Text>
              <Text>• New user registered</Text>
              <Text>• Low disk space on Server-2</Text>
            </VStack>
          </Box>

          <Box bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
            <Text fontSize="lg" mb={2}>Upcoming Maintenance</Text>
            <VStack align="start" gap={1} color={textSub}>
              <Text>• Configure alerts</Text>
              <Text>• Connect data source</Text>
              <Text>• View tutorial</Text>
            </VStack>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
