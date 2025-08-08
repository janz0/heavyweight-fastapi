// File: app/components/Dashboard.tsx
"use client";

import { Heading, Box, Flex, Text, VStack, SimpleGrid, Spinner, HStack, useBreakpointValue } from "@chakra-ui/react";
import { Line } from "react-chartjs-2";
import { Info, Folder, MapPin, Gauge, Database } from "phosphor-react";
import Link from "next/link";
import { Tooltip } from "@/app/src/components/ui/tooltip";
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
    <Box px={4} py={{base: "2", md: "2"}} className="text-color">
      <VStack align="start" gap={1} mb={{base: "2", md: "4"}} alignItems={{base: "center", md: "normal"}}>
        <Heading size={{base: "sm", md: "md"}}>Welcome <Text as="span" color="blue.600" _dark={{ color: "blue.300" }}>{firstName}</Text>!</Heading>
      </VStack>
      {/* Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4}} gap={{base: "2", md:"4"}} mb={4} pr={2} maxW={{base: "full", md: "breakpoint-xl"}} whiteSpace={"nowrap"}>
        {stats.map(s => {
          const IconComp = s.icon;
          const color = TYPE_COLORS[s.label];
          let label; if (size == 32) label = s.label; else label = s.labelShort
          return (
            <Link key={s.label} href={s.href || '#'} passHref style={{display: "contents"}}>
              <Box
                key={s.label}
                borderLeftColor={color}
                className="d-card"
              >
                <HStack align="center" justify="space-between">
                  <HStack color={"fg.info"}>
                    <IconComp size={size} weight="bold"/>
                    <Text fontSize={{base: "md", md: "xl"}} flexShrink={0} fontWeight="bold">{s.value}</Text>
                  </HStack>
                  <HStack>
                    <Text display="inline-flex" fontSize="clamp(0.75rem, 2.5vw, 1rem)" className="text-color" flexShrink={1} truncate alignItems={"center"} justifyContent="center">
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
                  opacity={0.3}
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
        <Box className="bg-card" w="55%" h="fit-content">
          <Text fontSize="lg" mb={4}>Requests Per Second</Text>
          <Line data={chartData} options={{ maintainAspectRatio: true } } />
        </Box>

        {/* Alerts & Maintenance */}
        <Flex direction="column" gap={6}>
          <Box className="bg-card">
            <Text fontSize="lg" mb={2}>Recent Alerts</Text>
            <VStack align="start" gap={1} className="subtext-color">
              <Text>• Server CPU usage is high</Text>
              <Text>• Database response time is slow</Text>
              <Text>• New user registered</Text>
              <Text>• Low disk space on Server-2</Text>
            </VStack>
          </Box>

          <Box className="bg-card">
            <Text fontSize="lg" mb={2}>Upcoming Maintenance</Text>
            <VStack align="start" gap={1} className="subtext-color">
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
