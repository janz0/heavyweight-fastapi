// File: app/locations/[location_name]/page.tsx

// Services + Types
import { Location } from "@/types/location";
import { getLocationByName } from "@/services/locations";
import LocationPageClient from "./LocationPageClient";
import { listSources } from "@/services/sources";
import { listSensors } from "@/services/sensors";

interface PageProps {
  params: Promise<{ location_name: string }>;
}

export default async function SensorsPage({ params }: PageProps) {
  const { location_name } = await params;

  const [location, initialSources, initialSensors] = await Promise.all([
    (getLocationByName(location_name)),
    listSources(),
    listSensors(),
  ]); 

  return (
    <LocationPageClient location={location} initialSources={initialSources} initialSensors={initialSensors}/>
  );
}
