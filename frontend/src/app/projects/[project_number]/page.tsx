// File: app/projects/[id]/page.tsx

// UI Components
import ProjectPageClient from './ProjectPageClient';

// Services + Types
import type { Project } from '@/types/project';
import { getProjectByNumber } from '@/services/projects';
import { listLocations } from '@/services/locations';
import { listSensors } from "@/services/sensors";
import { listSources } from "@/services/sources";

interface PageProps {
  params: Promise<{ project_number: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { project_number } = await params;

  const project: Project = await getProjectByNumber(project_number);

  const [initialLocations, initialSensors, initialSources] = await Promise.all([
    listLocations(project.id),
    listSensors(project.id),
    listSources(project.id),
  ]);

  return (
    <ProjectPageClient
      initialProject={project!}
      initialLocations={initialLocations}
      initialSensors={initialSensors}
      initialSources={initialSources}
    />
  );
}