// File: app/sources/[source_name]/page.tsx

// Services + Types
import type { Source } from "@/types/source";
import { getSourceByName } from "@/services/sources";
import SourcePageClient from "./SourcePageClient";

interface PageProps {
  params: Promise<{ source_name: string }>;
}

export default async function SourcePage({ params }: PageProps) {
  const { source_name } = await params;
  
  const source: Source = await Promise.resolve(getSourceByName(source_name))

  return (
    <SourcePageClient source={source}/>
  );
}
