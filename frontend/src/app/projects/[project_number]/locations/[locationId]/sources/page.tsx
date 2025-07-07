// File: app/projects/[projectId]/locations/[locationId]/sources/page.tsx

import SourcesPageClient from "./SourcesPageClient";
import type { Source } from "@/types/source";
import { listSources } from "@/services/sources";

interface PageProps {
  params: Promise<{ projectId: string; locationId: string }>;
}

export default async function SourcesPage({ params }: PageProps) {
  const { projectId, locationId } = await params;

  // Fetch all sources on the server (in parallel, if needed)
  let sources: Source[];
  try {
    sources = await listSources();
  } catch (err) {
    // You could render an error state instead, but for now just rethrow:
    throw new Error(
      `Failed to load sources for project=${projectId}, location=${locationId}: ${
        (err as Error).message
      }`
    );
  }

  return (
    // Pass the data + IDs down into our client component
    <SourcesPageClient
      sources={sources}
      projectId={projectId}
      locationId={locationId}
    />
  );
}
