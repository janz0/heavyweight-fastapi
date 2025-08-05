// File: app/sensors/[sensor_name]/page.tsx

// Services + Types
import type { MonitoringSensor } from "@/types/sensor";
import { getSensorByName } from "@/services/sensors";
import SensorPageClient from "./SensorPageClient";
import type { MonitoringSensorField } from "@/types/sensorField";
import { listSensorFields } from "@/services/sensorFields";
import { listSensorDataByField } from "@/services/sensorData";

interface PageProps {
  params: Promise<{ sensor_name: string }>;
}

export default async function SensorsPage({ params }: PageProps) {
  const { sensor_name } = await params;
  
  const sensor: MonitoringSensor = await Promise.resolve(getSensorByName(sensor_name));
  const fields: MonitoringSensorField[] = await Promise.resolve(listSensorFields(sensor.id));
    // 3) for each field, fetch its data and build a map:
  const entries = await Promise.all(
    fields.map(async (f) => {
      const data = await listSensorDataByField(f.id);
      return [f.field_name, data] as const;
    })
  );
  // now entries: Array<[ fieldName, MonitoringSensorData[] ]>
  const dataByField: Record<string, typeof entries[number][1]> =
  Object.fromEntries(entries);
  console.log(fields);
  console.log(dataByField);
  return (
    <SensorPageClient sensor={sensor}/>
  );
}
