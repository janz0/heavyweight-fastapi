// File: app/locations/[location_name]/page.tsx

// Services + Types
import { getLocationByName } from "@/services/locations";
import LocationPageClient from "./LocationPageClient";
import { listSources } from "@/services/sources";
import { listSensors } from "@/services/sensors";

interface PageProps {
  params: Promise<{ location_name: string }>;
}

export default async function LocationPage({ params }: PageProps) {
  const { location_name } = await params;
  const location = await getLocationByName(location_name);
  const [initialSources, initialSensors] = await Promise.all([
    listSources(undefined, location.id),
    listSensors(undefined, location.id),
  ]);
  return (
    <LocationPageClient location={location} initialSources={initialSources} initialSensors={initialSensors}/>
  );
}
