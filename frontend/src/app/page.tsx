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
import { apiFetchJson } from "@/services/api";
import { listProjects } from "@/services/projects";
import { listSources } from "@/services/sources";
import { listSensors } from "@/services/sensors";
import { LoginForm as Loginform } from "./components/UI/LoginForm";
import Dashboard, { DashboardProps } from "./components/UI/Dashboard";
import NoOrgLanding from "./components/NoOrgLanding";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

type MeResponse = {
  id: string;
  email: string;
  org: null | { org_id: string; role: string };
};

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
  const [noOrg, setNoOrg] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    (async () => {
      try {
        const me = await apiFetchJson<MeResponse>("/users/me", { method: "GET" }, authToken);

        if (!me.org) {
          setNoOrg(true);
          return;
        }

        const [projects, sources, sensors] = await Promise.all([
          listProjects(authToken),
          listSources(authToken),
          listSensors(authToken),
        ]);

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
  if (!authToken) return <Loginform />;

  if (noOrg) return <NoOrgLanding />;

  return <Dashboard {...dashboardData} loading={loading} />;
}
