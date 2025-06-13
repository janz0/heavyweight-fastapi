// File: app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Breadcrumb } from "@/app/components/Breadcrumb";
import { toaster } from "@/components/ui/toaster";
import { Box, Button, Flex, Heading, IconButton, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { Eye, EyeSlash, Warning, FolderSimple, ArrowsLeftRight } from "phosphor-react";
import { Chart as ChartJS, CategoryScale, LinearScale, Legend, LineElement, PointElement, Title, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";

import { useAuth } from "@/lib/auth";
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
      <Box p={8} borderRadius="md" borderWidth="1px" boxShadow="0px 1px 6px 2px rgb(0, 0, 0)" maxW="md" w="100%" bg="black" color="white" _dark={{bg: "white", color: "black", boxShadow: "0px 1px 6px 2px rgb(255, 255, 255)"}}>
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
                  background={"white"}
                  color="black"
                  _dark={{background: "black", color: "white"}}
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
              background={"white"}
              color={"black"}
              _dark={{background: "black", color: "white"}}
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

  const goToSources = () => {
    router.push("/sources");
  }

  return (
    <Box minH="100vh">
      {/* Breadcrumb */}
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
          {/* Top Cards -- Projects & Error Rate*/}
          <Flex gap={4} mb={4}>
            <Box as="button" onClick={goToProjects} flex="1" className="info-card shadow-md" cursor="pointer">
              <Flex align="center">
                <Box bg="orange.500" p={3} borderRadius="lg" mr={4}><FolderSimple size={32} /></Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="md">Projects</Text>
                  <Text fontSize="2xl" fontWeight="bold">5</Text>
                </VStack>
              </Flex>
            </Box>
            <Box as="button" onClick={goToSources} flex="1" className="info-card shadow-md">
              <Flex align="center">
                <Box bg="orange.500" p={3} borderRadius="lg" mr={4}><ArrowsLeftRight size={32} /></Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="md">Sources</Text>
                  <Text fontSize="2xl" fontWeight="bold">3</Text>
                </VStack>
              </Flex>
            </Box>
            <Box as="button" flex="1" className="info-card shadow-md">
              <Flex align="center">
                <Box bg="orange.500" p={3} borderRadius="lg" mr={4}><Warning size={32} /></Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="md">Error Rate</Text>
                  <Text fontSize="2xl" fontWeight="bold">0.3%</Text>
                </VStack>
              </Flex>
            </Box>
          </Flex>

          {/* Requests Per Second Graph */}
          <Box className="info-card shadow-md" flex="1">
            <Text fontSize="xl" mb={2} fontWeight="semibold">Requests Per Second</Text>
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
            className="info-card shadow-md"
            mb={4}
          >
            <Heading as="h3" size="md" mb={2}>Recent Alerts</Heading>
            <VStack align="start" gap={1} pl={2}>
              <Text>• Server CPU usage is high</Text>
              <Text>• Database response time is slow</Text>
              <Text>• New user registered</Text>
              <Text>• Low disk space on Server-2</Text>
            </VStack>
          </Box>

          {/* Next Steps */}
          <Box className="info-card shadow-md">
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
        <Spinner size="xl" />
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
