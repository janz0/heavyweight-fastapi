// File: app/sources/[source_name]/page.tsx

// Services + Types
import type { Source } from "@/types/source";
import { getSourceByName } from "@/services/sources";
import SourcePageClient from "./SourcePageClient";
import { listSensors } from "@/services/sensors";

interface PageProps {
  params: Promise<{ source_name: string }>;
}

export default async function SourcePage({ params }: PageProps) {
  const { source_name } = await params;
  const source: Source = await Promise.resolve(getSourceByName(source_name))

  const sensors = await listSensors(undefined, undefined, source.id);

  return (
    <SourcePageClient 
      initialSource={source}
      initialSensors={sensors}
    />
  );
}
