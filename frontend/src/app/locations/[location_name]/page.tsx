// File: app/locations/[location_name]/page.tsx

// Services + Types
import { getLocationByName } from "@/services/locations";
import LocationPageClient from "./LocationPageClient";
import { listSources } from "@/services/sources";
import { listSensors } from "@/services/sensors";
import { listMonitoringGroups } from "@/services/monitoringGroups";
import { Location } from "@/types/location";

interface PageProps {
  params: Promise<{ location_name: string }>;
}

export default async function LocationPage({ params }: PageProps) {
  const { location_name } = await params;
  const location : Location = await getLocationByName(location_name);
  const [initialSources, initialSensors, initialGroups] = await Promise.all([
    listSources(undefined, location.id),
    listSensors(undefined, location.id),
    listMonitoringGroups(location.id),
  ]);
  return (
    <LocationPageClient initialLocation={location} initialSources={initialSources} initialSensors={initialSensors} initialGroups={initialGroups}/>
  );
}
