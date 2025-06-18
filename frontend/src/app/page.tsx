// File: app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useColorMode } from "./src/components/ui/color-mode";
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
import { useAuth } from "@/lib/auth";
import { loginUser } from "@/services/auth";
import { listProjects } from "@/services/projects";
import { listSources } from "@/services/sources";
import { Eye, EyeSlash } from "phosphor-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
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
  const router = useRouter();
  const { colorMode } = useColorMode();

  const [loading, setLoading] = useState(true);
  const [activeProjects, setProjects] = useState(0);
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
        setLocations(projects.reduce((sum, p) => sum + (p.locations_count ?? 0), 0));

        const sources = await listSources();
        setSensors(
          sources.filter(s => s.source_type === 'sensor' && s.active === 1).length
        );
        setSources(sources.length);
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
    { label: 'Active Projects', value: activeProjects, onClick: () => router.push('/projects') },
    { label: 'Total Locations', value: totalLocations, onClick: () => router.push('/locations') },
    { label: 'Online Sensors',  value: onlineSensors, onClick: () => router.push('/sensors')},
    { label: 'Sources',         value: totalSources,    onClick: () => router.push('/sources') },
    { label: 'Open Alerts',     value: 0 },
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
          <Box
            key={s.label}
            flex="1"
            minW="150px"
            bg={cardBg}
            p={4}
            borderRadius="md"
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
            onClick={s.onClick}
            cursor={s.onClick ? 'pointer' : 'default'}
          >
            <Text fontSize="sm" color={textSub}>{s.label}</Text>
            <Text fontSize="2xl" fontWeight="bold" color={accent}>{s.value}</Text>
          </Box>
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
