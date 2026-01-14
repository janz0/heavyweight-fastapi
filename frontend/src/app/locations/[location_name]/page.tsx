// File: app/locations/[location_name]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useColorMode } from "../../src/components/ui/color-mode";

// Services + Types
import { useAuth } from "@/lib/auth";
import { getLocationByName } from "@/services/locations";
import LocationPageClient from "./LocationPageClient";
import { listSources } from "@/services/sources";
import { listSensors } from "@/services/sensors";
import { listMonitoringGroups } from "@/services/monitoringGroups";
import { Location } from "@/types/location";
import { MonitoringSensor } from "@/types/sensor";
import { Source } from "@/types/source";
import { MonitoringGroup } from "@/types/monitoringGroup";
import { Flex, Spinner } from "@chakra-ui/react";

export default function LocationPage() {
  const { location_name } = useParams<{ location_name: string }>();
  const { authToken } = useAuth();
  const { colorMode } = useColorMode();
  const bg = colorMode === 'light' ? 'gray.100' : 'gray.800';
  const accent = colorMode === 'light' ? '#3B82F6' : '#60A5FA';
  const [error, setError] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);

  const [location, setLocation] = useState<Location | null>(null);

  const [initialSources, setSources] = useState<Source[]>([]);
  const [initialSensors, setSensors] = useState<MonitoringSensor[]>([]);
  const [initialGroups, setGroups] = useState<MonitoringGroup[]>([]);

  useEffect(() => {
      if (!authToken) return;
  
      let cancelled = false;
  
      setLoaded(false);
  
      (async () => {
        try {
          const loc = await getLocationByName(location_name, authToken);
          if (cancelled) return;
  
          setLocation(loc);
  
          const [sources, sensors, groups] = await Promise.all([
            listSources(authToken, undefined, loc.id),
            listSensors(authToken, undefined, loc.id),
            listMonitoringGroups(loc.id),
          ]);
  
          if (cancelled) return;
  
          setSensors(sensors);
          setSources(sources);
          setGroups(groups);
          setLoaded(true);
        } catch (e) {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : String(e));
        }
      })();
  
      return () => {
        cancelled = true;
      };
    }, [authToken, location_name]);

  if (error) return <div>Error: {error}</div>;
  if (!loaded || !location) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }
  
  return (
    <LocationPageClient initialLocation={location!} initialSources={initialSources!} initialSensors={initialSensors!} initialGroups={initialGroups!} authToken={authToken!}/>
  );
}
