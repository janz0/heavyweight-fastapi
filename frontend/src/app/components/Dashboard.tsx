// File: app/components/Dashboard.tsx
"use client";

import { Heading, Box, Flex, Text, VStack, SimpleGrid, Spinner, HStack } from "@chakra-ui/react";
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
  const { colorMode } = useColorMode();
  const bg      = colorMode === 'light' ? 'gray.300' : '#111111';
  const cardBg  = colorMode === 'light' ? 'gray.200' : '#2c2c2c';
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const accent  = colorMode === 'light' ? '#3B82F6' : '#60A5FA';
  const stats = [
    { label: 'Active Projects',   value: activeProjects,  href: '/projects', icon: Folder },
    { label: 'Total Locations',   value: totalLocations,  href: '/locations', icon: MapPin },
    { label: 'Online Sensors',    value: onlineSensors,   href: '/sensors',   icon: Gauge },
    { label: 'Sources',           value: totalSources,    href: '/sources',   icon: Database },
  ];

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
    <Box minH="100vh" px={6} py={{base: "2", md: "4"}} bg={bg} color={text}>
      <VStack align="start" gap={1} mb={{base: "2", md: "6"}} alignItems={{base: "center", md: "normal"}}>
        <Heading size={{base: "md", md: "xl"}}>Welcome back, {firstName} 👋</Heading>
        <Text fontSize="md" color={textSub} display={{base: "none", sm: "block"}}>
          Here`s a quick glance at your monitoring metrics today.
        </Text>
      </VStack>
      {/* Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4}} gap={{base: "2", md:"4"}} mb={4} pr={2} maxW={{base: "full", md: "breakpoint-lg"}} whiteSpace={"nowrap"}>
        {stats.map(s => {
          const IconComp = s.icon;
          return (
            <Link key={s.label} href={s.href || '#'} passHref style={{display: "contents"}}>
              <Box
                key={s.label}
                flex="1"
                bg={cardBg}
                p={{base: "2", md: "4"}}
                borderRadius="md"
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
              >
                <HStack alignItems={"center"} gap={2}>
                  <IconComp size={24} weight="bold" color={accent}/>
                  <Text fontSize={{base: "md", md: "xl"}} flexShrink={0} fontWeight="bold" color={accent}>{s.value}</Text>
                  <Text fontSize="sm" color={textSub} flexShrink={1} truncate>
                    {s.label}
                    {s.label === 'Active Projects' && (
                      <Box as="span" ml={1}>
                        <Tooltip
                          content={`${activeProjects} active of ${totalProjects} total`}
                          showArrow
                          openDelay={100}
                          closeDelay={100}
                        >
                          <Box as="span" display="inline-flex" alignItems="center" cursor="pointer">
                            <Info size={14} weight="bold" />
                          </Box>
                        </Tooltip>
                      </Box>
                    )}
                  </Text>
                </HStack>
              </Box>
            </Link>
          );
        })}
      </SimpleGrid>

      {/* Main Chart & Side Panels */}
      <Flex direction={['column', 'column', 'row']} gap={6}>
        {/* Chart */}
        <Box flex="3" bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="lg" mb={4}>Requests Per Second</Text>
          <Line data={chartData} options={{ maintainAspectRatio: true } } />
        </Box>

        {/* Alerts & Maintenance */}
        <Flex direction="column" flex="1" gap={6}>
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
