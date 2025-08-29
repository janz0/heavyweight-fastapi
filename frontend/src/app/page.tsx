// File: app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Flex, Spinner } from "@chakra-ui/react";
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
import { useAuth } from "@/lib/auth";
import { listProjects } from "@/services/projects";
import { listSources } from "@/services/sources";
import { listSensors } from "@/services/sensors";
import { LoginForm as Loginform } from "./components/UI/LoginForm";
import Dashboard, { DashboardProps } from "./components/UI/Dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

export default function Page() {
  const { authToken, isChecking } = useAuth();
  const [dashboardData, setDashboardData] = useState<Omit<DashboardProps,'loading'>>({
    activeProjects:  0,
    totalProjects:   0,
    totalLocations:  0,
    totalSensors:   0,
    totalSources:    0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) return;
    (async () => {
      try {
        const projects = await listProjects();
        const sources  = await listSources();
        const sensors  = await listSensors();

        setDashboardData({
          activeProjects:  projects.filter(p => p.active === 1).length,
          totalProjects:   projects.length,
          totalLocations:  projects.reduce((sum, p) => sum + (p.locations_count||0), 0),
          totalSources:    sources.length,
          totalSensors:   sensors.length,
        });
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authToken]);

  if (isChecking || (authToken && loading)) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return authToken ? <Dashboard {...dashboardData} loading={loading} /> : <Loginform />;
}
