// File: app/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Spinner,
  Heading,
  Button,
  IconButton,
  Input,
} from "@chakra-ui/react";
import { Tooltip } from "@/app/src/components/ui/tooltip";
import { useColorMode } from "./src/components/ui/color-mode";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useAuth } from "@/lib/auth";
import { loginUser } from "@/services/auth";
import { listProjects } from "@/services/projects";
import { listSources } from "@/services/sources";
import { listSensors } from "@/services/sensors";
import { Eye, EyeSlash } from "phosphor-react";
import { Info } from "phosphor-react";
import Link from "next/link";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

// ---------------------------------------
// 1. LoginForm: shows email/password + toggles visibility.
// ---------------------------------------
function LoginForm() {
  const { signIn } = useAuth();
  const { colorMode } = useColorMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await loginUser(email, password);
      signIn(access_token);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" minH="100vh"
      bg={colorMode === 'light' ? 'gray.100' : 'gray.800'}
    >
      <Box
        bg={colorMode === 'light' ? 'white' : 'gray.700'}
        color={colorMode === 'light' ? 'gray.800' : 'gray.200'}
        p={8}
        borderRadius="md"
        boxShadow="md"
        w="full"
        maxW="md"
      >
        <Heading as="h2" size="lg" mb={6} textAlign="center">
          Sign In
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack gap={4} align="stretch">
            <Box>
              <Text mb={1} fontWeight="semibold">
                Email
              </Text>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Box>
            <Box>
              <Text mb={1} fontWeight="semibold">
                Password
              </Text>
              <Flex align="center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <IconButton
                  ml={2}
                  size="sm"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </IconButton>
              </Flex>
            </Box>
            <Button
              type="submit"
              loading={loading}
              loadingText="Signing in…"
              colorScheme="blue"
            >
              Sign In
            </Button>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}

// ---------------------------------------
// 2. Dashboard: Only visible once logged in.
// ---------------------------------------
function Dashboard() {
  const { colorMode } = useColorMode();

  const [loading, setLoading] = useState(true);
  const [activeProjects, setProjects] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalLocations, setLocations] = useState(0);
  const [onlineSensors, setSensors] = useState(0);
  const [totalSources, setSources] = useState(0);

  // derive theme tokens
  const bg      = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const cardBg  = colorMode === 'light' ? 'white'    : 'gray.700';
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const textSub = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const accent  = colorMode === 'light' ? '#3B82F6' : '#60A5FA';

  useEffect(() => {
    (async () => {
      try {
        const projects = await listProjects();
        setProjects(projects.filter(p => p.active === 1).length);
        setTotalProjects(projects.length);
        setLocations(projects.reduce((sum, p) => sum + (p.locations_count ?? 0), 0));
        
        const sources = await listSources();
        setSources(sources.length);

        const sensors = await listSensors();
        setSensors(sensors.filter(s => s.active === 1).length);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }

const stats = [
  { label: 'Active Projects', value: activeProjects, href: '/projects' },
  { label: 'Total Locations', value: totalLocations, href: '/locations' },
  { label: 'Online Sensors',  value: onlineSensors, href: '/sensors' },
  { label: 'Sources', value: totalSources, href: '/sources' },
  { label: 'Open Alerts', value: 0 },
];

  // chart data
  const chartData = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
    datasets: [
      {
        data: [30,45,28,50,42,60,55],
        fill: false,
        tension: 0.4,
        borderColor: accent,
        pointBackgroundColor: accent,
      }
    ]
  };

  return (
    <Box minH="100vh" p={6} bg={bg} color={text}>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center">
        <Heading size="lg">RWH Monitoring</Heading>
      </Flex>

      {/* Metrics */}
      <Flex wrap="wrap" gap={4} mb={6}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href || '#'} passHref style={{display: "contents"}}>
            <Box
              key={s.label}
              flex="1"
              minW="150px"
              bg={cardBg}
              p={4}
              borderRadius="md"
              boxShadow="sm"
              _hover={{ boxShadow: 'md' }}
            >
              <Text fontSize="sm" color={textSub}>{s.label}
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
              <Text fontSize="2xl" fontWeight="bold" color={accent}>{s.value}</Text>
            </Box>
          </Link>
        ))}
      </Flex>

      {/* Main Chart & Side Panels */}
      <Flex direction={['column','row']} gap={6}>
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

// ---------------------------------------
// 3. Default export: show <LoginForm> if not logged in, else show <Dashboard>.
// ---------------------------------------
export default function Page() {
  const { authToken, isChecking } = useAuth();

  if (isChecking) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return authToken ? <Dashboard /> : <LoginForm />;
}
