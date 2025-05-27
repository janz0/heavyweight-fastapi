// File: app/projects/page.tsx
import ProjectsPageClient from './ProjectsPageClient';
import type { Project } from '@/types/project';
import { listProjects } from '@/services/projects';

export default async function ProjectsPage() {
  // Fetch fresh on every request
  const projects: Project[] = await listProjects();
  return <ProjectsPageClient projects={projects} />;
}
