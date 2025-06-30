// File: app/projects/[id]/page.tsx
import ProjectPageClient from './ProjectPageClient';
import type { Project }  from '@/types/project';
import { getProjectByNumber }    from '@/services/projects';
import { listLocations } from '@/services/locations';
import type { Location } from '@/types/location';

interface PageProps {
  params: Promise<{ project_number: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { project_number } = await params
  const project: Project = await getProjectByNumber(project_number);
  // If you also want to server-fetch its locations:
  const locations: Location[] = await listLocations(project.id);
  return (
    <ProjectPageClient
      project={project}
      initialLocations={locations}
    />
  );
}
