// app/projects/[projectId]/locations/[locationId]/page.tsx

import LocationPageClient from './LocationPageClient'
import type { Location } from '@/types/location'
import type { Project }  from '@/types/project'
import { getLocation }   from '@/services/locations'
import { getProject }    from '@/services/projects'

interface PageProps {
  params: Promise<{ projectId: string; locationId: string }>;
}

export default async function LocationPage({ params }: PageProps) {
  const { projectId, locationId } = await params

  // Fetch both in parallel
  const [ project, location ] = await Promise.all([
    getProject(projectId),
    getLocation(locationId),
  ]) as [Project, Location]

  return (
    <LocationPageClient
      projectName={project.project_name}
      location={location}
    />
  )
}
