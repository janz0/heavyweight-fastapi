// File: app/sensors/[sensor_name]/page.tsx
"use client";

// Services + Types
import type { MonitoringSensor } from "@/types/sensor";
import { getSensorByName } from "@/services/sensors";
import SensorPageClient from "./SensorPageClient";
//import type { MonitoringSensorField } from "@/types/sensorField";
//import { listSensorFields } from "@/services/sensorFields";
//import { listSensorDataByField } from "@/services/sensorData";
import { useAuth } from "@/lib/auth";
import { useParams } from "next/navigation";
//import type { MonitoringSensorData } from "@/types/sensorData";
import { useState, useMemo, useEffect } from "react";


export default function SensorsPage() {
  const { sensor_name } = useParams<{ sensor_name: string }>();
  const { authToken } = useAuth();

  const [sensor, setSensor] = useState<MonitoringSensor | null>(null);
  //const [fields, setFields] = useState<MonitoringSensorField[]>([]);
  //const [dataByField, setDataByField] = useState<Record<string, MonitoringSensorData[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!authToken) return;
    if (!sensor_name) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const s = await getSensorByName(sensor_name, authToken);
        if (cancelled) return;
        setSensor(s);

        //const flds = await listSensorFields(s.id);
        if (cancelled) return;
        //setFields(flds);

        /*const entries = await Promise.all(
          flds.map(async (f) => {
            const data = await listSensorDataByField(f.id);
            return [f.field_name, data] as const;
          })
        );*/
        if (cancelled) return;

        //setDataByField(Object.fromEntries(entries));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, sensor_name]);

  // optional: memo if you pass it down
  const safeAuthToken = useMemo(() => authToken ?? "", [authToken]);

  if (!authToken) return null; // or a login prompt
  if (loading || !sensor) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <SensorPageClient
      initialSensor={sensor}
      authToken={safeAuthToken}
    />
  );
}