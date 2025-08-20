// File: app/components/Dashboard.tsx
"use client";

import { Heading, Box, Flex, Text, SimpleGrid, Spinner, HStack, useBreakpointValue, Separator, Tabs } from "@chakra-ui/react";
import { Line } from "react-chartjs-2";
import { Info, Folder, MapPin, Gauge, Database, WarningCircle, CalendarCheck } from "phosphor-react";
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
      <Heading size={{base: "sm", md: "md"}} fontWeight={"light"} fontSize={14}>Welcome <Text as="span" /*color="blue.600" _dark={{ color: "blue.300" }}*/>{firstName}</Text>!</Heading>
      {/* Metrics */}
      <Separator variant="solid" size="lg" marginY="2" borderColor={'gray.200'} _dark={{borderColor: 'gray.600'}}/>
      <SimpleGrid columns={{ base: 2, md: 4}} gap={{base: "2", md:"4"}} my={4} pr={2} maxW={{base: "full", md: "breakpoint-xl"}} whiteSpace={"nowrap"} mx="auto" justifyContent={"center"}>
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
                    <Text fontSize={{base: "md", lg: "xl"}} flexShrink={0} fontWeight="bold">{s.value}</Text>
                  </HStack>
                  <HStack>
                    <Text display="inline-flex" fontSize={{base: "clamp(0.75rem, 2.5vw, 1rem)", md: "75%", lg: "md"}} className="text-color" flexShrink={1} truncate alignItems={"center"} justifyContent="center">
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
                    viewBox="0 0 200 15"
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
      <Flex direction={['column', 'column', 'row']} gap={4}>
        {/* Chart */}
        <Box className="bg-card" minW={{base: "full", md: "4/6"}}>
          <Text fontSize="lg" mb={4}>Requests Per Second</Text>
          <Line data={chartData} options={{ maintainAspectRatio: true } } />
        </Box>

        {/* Alerts & Maintenance */}
        <Tabs.Root key={"outline"} defaultValue="alerts" variant={"outline"} className="bg-card" h="fit-content">
          <Tabs.List>
            <Tabs.Trigger value="alerts">
              <WarningCircle />
              Alerts
            </Tabs.Trigger>
            <Tabs.Trigger value="schedule">
              <CalendarCheck />
              Schedule
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="alerts">
          </Tabs.Content>
          <Tabs.Content value="schedule">
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Box>
  );
}
