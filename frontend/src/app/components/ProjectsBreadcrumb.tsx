// app/components/ProjectsBreadcrumb.tsx
'use client';

import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';

const PROJECTS_BASE_CRUMBS: BreadcrumbItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Projects',  href: '/projects' },
];

interface ProjectsBreadcrumbProps {
  projectName?: string;
  projectId?: string;
  locationName?: string;
  locationId?: string;
}

export function ProjectsBreadcrumb({
  projectName,
  projectId,
  locationName,
  locationId,
}: ProjectsBreadcrumbProps) {
  // Start with Dashboard → Projects
  const crumbs: BreadcrumbItem[] = [...PROJECTS_BASE_CRUMBS];

  // If a project is selected, add “ProjectName”
  if (projectName && projectId) {
    crumbs.push({
      label: projectName,
      href: `/projects/${projectId}`,
    });
  }

  // If a location is selected, add “LocationName”
  if (locationName && locationId && projectId) {
    crumbs.push({
      label: locationName,
      href: `/projects/${projectId}/locations/${locationId}`,
    });
  }

  // Hand off the final array to the generic <Breadcrumb>
  return <Breadcrumb crumbs={crumbs} />;
}
