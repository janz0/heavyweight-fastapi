// File: app/sources/[source_name]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Flex, Spinner } from "@chakra-ui/react";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// Services + Types
import type { Source } from "@/types/source";
import type { MonitoringSensor } from "@/types/sensor";
import { getSourceByName } from "@/services/sources";
import { listSensors } from "@/services/sensors";
import { useAuth } from "@/lib/auth";

// UI
import SourcePageClient from "./SourcePageClient";

export default function SourcePage() {
  const { source_name } = useParams<{ source_name: string }>();
  const { authToken } = useAuth();

  const { colorMode } = useColorMode();
  const bg = colorMode === "light" ? "gray.100" : "gray.800";
  const accent = colorMode === "light" ? "#3B82F6" : "#60A5FA";

  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [source, setSource] = useState<Source | null>(null);
  const [sensors, setSensors] = useState<MonitoringSensor[]>([]);

  useEffect(() => {
    if (!authToken) return;
    if (!source_name) return;

    let cancelled = false;
    setLoaded(false);
    setError(null);

    (async () => {
      try {
        const src = await getSourceByName(source_name, authToken);
        if (cancelled) return;

        setSource(src);

        const sens = await listSensors(authToken, undefined, undefined, src.id);
        if (cancelled) return;

        setSensors(sens);
        setLoaded(true);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, source_name]);

  if (error) return <div>Error: {error}</div>;

  if (!loaded || !source) {
    return (
      <Flex h="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accent} />
      </Flex>
    );
  }

  return (
    <SourcePageClient
      initialSource={source}
      initialSensors={sensors}
      authToken={authToken!}
    />
  );
}
