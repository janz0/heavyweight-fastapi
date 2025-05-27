// app/page.tsx
"use client";

import {
  Box,
  Flex,
  Heading,
  Input,
  InputGroup,
  Text,
  IconButton,
  Spacer,
  VStack,
} from "@chakra-ui/react";
import { MagnifyingGlass, List, Users, Warning, FolderSimple } from "phosphor-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/navigation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
    const router = useRouter();
  const name = "Jane Doe"; // dummy user name

  // dummy chart data
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        data: [30, 45, 28, 50, 42, 60, 55],
        fill: false,
        tension: 0.4,
        borderColor: "#FFA500",
      },
    ],
  };

  const goToProjects = () => {
    router.push("/projects");
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-top, pageGradientFrom, pageGradientTo)"
      color="text"
    >
      {/* Top Bar */}
      <Flex align="center" px={6} py={4}>
        <IconButton aria-label="Menu" variant="ghost" mr={4} color="white">
            <List size={24} />
        </IconButton>


        <Heading
          as="h1"
          size="3xl"
          fontWeight="extrabold"
          position="relative"
          display="inline-block"
          pb={2}
          _after={{
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "50%",
            height: "3px",
            bgGradient: "linear(to-r, accent1, accent2)",
            borderRadius: "2px",
          }}
        >
          Dashboard
        </Heading>

        <Spacer />

        <Box minW="400px" mr={12}>
          <InputGroup
            startElement={<MagnifyingGlass size={16} />}
            startElementProps={{ pointerEvents: "none" }}
          >
            <Input
              variant="outline"
              placeholder="Search metrics, resources..."
              bg="sidebarBg"
              borderColor="rgba(255,255,255,0.2)"
              _placeholder={{ color: "textSecondary" }}
              color="text"
            />
          </InputGroup>
        </Box>
      </Flex>

      {/* Welcome */}
      <Box px={6} pt={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Welcome, {name}!
        </Text>
        <Text color="textSecondary" mt={1}>
          Here's your real-time monitoring dashboard.
        </Text>
      </Box>

      {/* Main Content */}
      <Flex px={6} py={4} gap={4}>
        {/* Left Column */}
        <Box flex="2">
          {/* Top Cards */}
          <Flex gap={4} mb={4}>
            <Box
                as="button"
                onClick={goToProjects}
                role="group"
                cursor="pointer"
                p={6}
                borderRadius="lg"
                bg={"whiteAlpha.50"}
                boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.24)"
                transition="all 0.2s"
                flex="1"
                _hover={{
                    boxShadow: "0 4px 8px rgb(250, 250, 250)",
                    transform: "translateY(-2px)",
                }}
                _active={{
                    bg: "whiteAlpha.800",
                    boxShadow: "0 4px 8px rgba(255, 255, 255, 0.4)",
                    transform: "translateY(-1px)",
                }}
                >
              <Flex align="center">
                <Box bg="orange.500" p={3} borderRadius="md" mr={4}>
                  <FolderSimple size={32} color="white" />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="2xl" fontWeight="bold">Projects</Text>
                  <Text fontSize="md">5</Text>
                </VStack>
              </Flex>
            </Box>

            <Box
              bg="whiteAlpha.50"
              p={6}
              borderRadius="lg"
              boxShadow="md"
              color="white"
              flex="1"
            >
              <Flex align="center">
                <Box bg="orange.500" p={3} borderRadius="md" mr={4}>
                  <Warning size={32} color="white" />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" color="textSecondary">
                    Error Rate
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    0.3%
                  </Text>
                </VStack>
              </Flex>
            </Box>
          </Flex>

          {/* Requests Per Second Graph */}
          <Box
            bg="whiteAlpha.50"
            p={6}
            borderRadius="lg"
            boxShadow="md"
            color="white"
            flex="1"
          >
            <Text fontSize="md" mb={2} fontWeight="semibold">
              Requests Per Second
            </Text>
            <Line data={chartData} />
          </Box>

          {/* Get Started */}
          <Box bg="sidebarBg" p={4} borderRadius="md" mt={4}>
            <Heading as="h3" size="md" mb={2}>
              Get Started
            </Heading>
            <VStack align="start" gap={1} pl={2}>
              <Text>• Configure alerts</Text>
              <Text>• Connect data source</Text>
              <Text>• View tutorial</Text>
            </VStack>
          </Box>
        </Box>

        {/* Right Column */}
        <Box flex="1">
          {/* Recent Alerts */}
          <Box
            bg="whiteAlpha.50"
            p={6}
            borderRadius="lg"
            boxShadow="md"
            color="white"
            mb={4}
          >
            <Heading as="h3" size="md" mb={2}>
              Recent Alerts
            </Heading>
            <VStack align="start" gap={1} pl={2}>
              <Text>• Server CPU usage is high</Text>
              <Text>• Database response time is slow</Text>
              <Text>• New user registered</Text>
              <Text>• Low disk space on Server-2</Text>
            </VStack>
          </Box>

          {/* Next Steps */}
          <Box bg="whiteAlpha.50" p={6} borderRadius="lg" boxShadow="md" color="white">
            <Heading as="h3" size="md" mb={2}>
              Next Steps
            </Heading>
            <VStack align="start" gap={1} pl={2}>
              <Text>• Configure alerts</Text>
              <Text>• Connect data source</Text>
              <Text>• View tutorial</Text>
            </VStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
