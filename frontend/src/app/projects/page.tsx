// File: app/projects/page.tsx
"use client";

import { useState, useEffect } from "react";

import ProjectsPageClient from "./ProjectsPageClient";

import { listProjects } from "@/services/projects";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllProjects() {
      try {
        const data = await listProjects();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    fetchAllProjects();
  }, []);

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "red" }}>
        Error loading projects: {error}
      </div>
    );
  }

  if (!projects) {
    return (
      <div style={{ padding: "1rem" }}>
        Loading projects…
      </div>
    );
  }

  return <ProjectsPageClient projects={projects} />;
}
