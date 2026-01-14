// File: app/projects/[project_number]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// UI Components
import { Flex, Spinner } from "@chakra-ui/react";
import ProjectPageClient from './ProjectPageClient';
import { useColorMode } from "../../src/components/ui/color-mode";

// Services + Types
import { useAuth } from "@/lib/auth";
import type { Project } from '@/types/project';
import type { Location } from "@/types/location";
import type { Source } from "@/types/source";
import type { MonitoringSensor } from "@/types/sensor";
import { getProjectByNumber } from '@/services/projects';
import { listLocations } from '@/services/locations';
import { listSensors } from "@/services/sensors";
import { listSources } from "@/services/sources";

export default function ProjectPage() {
  const { project_number } = useParams<{ project_number: string }>();
  const { authToken } = useAuth();
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';
  const [error, setError] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);

  const [project, setProject] = useState<Project | null>(null);
  const [initialLocations, setLocations] = useState<Location[]>([]);
  const [initialSensors, setSensors] = useState<MonitoringSensor[]>([]);
  const [initialSources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;

    setLoaded(false);

    (async () => {
      try {
        const proj = await getProjectByNumber(project_number, authToken);
        if (cancelled) return;

        setProject(proj);

        const [locs, sensors, sources] = await Promise.all([
          listLocations(authToken, proj.id),
          listSensors(authToken, proj.id),
          listSources(authToken, proj.id),
        ]);

        if (cancelled) return;

        setLocations(locs);
        setSensors(sensors);
        setSources(sources);
        setLoaded(true);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, project_number]);

  if (error) return <div>Error: {error}</div>;
  if (!loaded || !project) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }
  return (
    <ProjectPageClient
      initialProject={project!}
      initialLocations={initialLocations!}
      initialSensors={initialSensors!}
      initialSources={initialSources!}
      authToken={authToken!}
    />
  );
}