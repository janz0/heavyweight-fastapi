// File: app/page.tsx
"use client";

import { Breadcrumb } from "@/app/components/Breadcrumb";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Warning,
  FolderSimple,
  Eye,
  EyeSlash,
} from "phosphor-react";
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
import { useState } from "react";
import { useRouter } from "next/navigation";

// Pull in our custom auth hook:
import { useAuth } from "@/lib/auth";

// Pull in our Toaster so that login errors/successes can display:
import { toaster } from "@/components/ui/toaster";

// Import the service function from app/services/auth.ts:
import { loginUser } from "@/services/auth";

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
//    On submit, it calls loginUser(...) and then useAuth().signIn(...) on success.
// ---------------------------------------
function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { access_token } = await loginUser(email, password);

      // Inform AuthProvider immediately:
      signIn(access_token);

      toaster.create({
        title: "Signed in successfully",
        duration: 3000,
        closable: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toaster.create({
        title: "Login Error",
        description: msg,
        duration: 4000,
        closable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" minH="100vh">
      <Box bg="white" p={8} borderRadius="md" boxShadow="lg" maxW="md" w="100%">
        <Heading as="h2" size="lg" mb={6} textAlign="center">
          Sign In
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack gap={4} align="stretch">
            {/* Email */}
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

            {/* Password */}
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
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  size="sm"
                  ml={2}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </IconButton>
              </Flex>
            </Box>

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              loadingText="Signing in…"
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
// 2. Dashboard: same as before, but only visible once logged in.
// ---------------------------------------
function Dashboard() {
  const router = useRouter();

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
  };

  return (
    <Box
      minH="100vh"
    >
      <Breadcrumb crumbs={[{label: "Dashboard", href: "/"}]} />
      {/* Welcome */}
      <Box px={6} pt={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Welcome!
        </Text>
        <Text mt={1}>
          Here’s your real-time monitoring dashboard.
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
              boxShadow="0px 4px 8px rgba(0, 0, 0, 0.24)"
              transition="all 0.2s"
              flex="1"
              _hover={{
                boxShadow: "0 4px 8px rgb(250, 250, 250)",
                transform: "translateY(-2px)",
              }}
              _active={{
                boxShadow: "0 4px 8px rgba(255, 255, 255, 0.4)",
                transform: "translateY(-1px)",
              }}
            >
              <Flex align="center">
                <Box bg="orange.500" p={3} borderRadius="md" mr={4}>
                  <FolderSimple size={32} />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="2xl" fontWeight="bold">
                    Projects
                  </Text>
                  <Text fontSize="md">5</Text>
                </VStack>
              </Flex>
            </Box>

            <Box
              as="button"
              role="group"
              cursor="pointer"
              p={6}
              borderRadius="lg"
              boxShadow="0px 4px 8px rgba(0, 0, 0, 0.24)"
              transition="all 0.2s"
              flex="1"
              _hover={{
                boxShadow: "0 4px 8px rgb(250, 250, 250)",
                transform: "translateY(-2px)",
              }}
              _active={{
                boxShadow: "0 4px 8px rgba(255, 255, 255, 0.4)",
                transform: "translateY(-1px)",
              }}
            >
              <Flex align="center">
                <Box bg="orange.500" p={3} borderRadius="md" mr={4}>
                  <Warning size={32} />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm">
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
            p={6}
            borderRadius="lg"
            boxShadow="0px 4px 8px rgba(0, 0, 0, 0.24)"
            flex="1"
          >
            <Text fontSize="md" mb={2} fontWeight="semibold">
              Requests Per Second
            </Text>
            <Line data={chartData} />
          </Box>

          {/* Get Started */}
          <Box p={4} borderRadius="md" mt={4}>
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
            p={6}
            borderRadius="lg"
            boxShadow="0px 4px 8px rgba(0, 0, 0, 0.24)"
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
          <Box
            p={6}
            borderRadius="lg"
            boxShadow="0px 4px 8px rgba(0, 0, 0, 0.24)"
          >
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

// ---------------------------------------
// 3. Default export: show <LoginForm> if not logged in, else show <Dashboard>.
// ---------------------------------------
export default function Page() {
  const { authToken, isChecking } = useAuth();

  // While verifying localStorage, show a spinner
  if (isChecking) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="white" />
      </Flex>
    );
  }

  // If not authenticated, render login form
  if (!authToken) {
    return <LoginForm />;
  }

  // Otherwise render dashboard
  return <Dashboard />;
}
