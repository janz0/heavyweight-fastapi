// File: app/sensors/page.tsx

// Services + Types
import type { MonitoringSensor } from "@/types/sensor";
import { getSensorByName } from "@/services/sensors";
import SensorPageClient from "./SensorPageClient";

interface PageProps {
  params: Promise<{ sensor_name: string }>;
}

export default async function SensorsPage({ params }: PageProps) {
  const { sensor_name } = await params;
  
  const sensor: MonitoringSensor = await Promise.resolve(getSensorByName(sensor_name))

  return (
    <SensorPageClient sensor={sensor}/>
  );
}
