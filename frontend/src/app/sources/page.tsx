// File: app/sources/page.tsx
"use client";

import { useState, useEffect } from "react";

import SourcesPageClient from "./SourcesPageClient";

import { listSources } from "@/services/sources";
import type { Source } from "@/types/source";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllSources() {
      try {
        const data = await listSources();
        setSources(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    fetchAllSources();
  }, []);

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "red" }}>
        Error loading sources: {error}
      </div>
    );
  }

  if (!sources) {
    return (
      <div style={{ padding: "1rem" }}>
        Loading sources…
      </div>
    );
  }
  return <SourcesPageClient sources={sources} />;
}