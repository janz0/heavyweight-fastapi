// File: app/projects/[id]/page.tsx
import ProjectPageClient from './ProjectPageClient';
import type { Project }  from '@/types/project';
import { getProject }    from '@/services/projects';
import { listLocations } from '@/services/locations';
import type { Location } from '@/types/location';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params
  const project: Project = await getProject(projectId);
  // If you also want to server-fetch its locations:
  const locations: Location[] = await listLocations(projectId);
  return (
    <ProjectPageClient
      project={project}
      initialLocations={locations}
    />
  );
}
