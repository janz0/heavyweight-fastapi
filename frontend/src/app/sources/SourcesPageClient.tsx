// File: app/sources/components/SourcesPageClient.tsx
"use client";

// React + Next Imports
import { useState, useEffect } from "react";

// Chakra Imports + Icons
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import DataTable from "@/app/components/DataTable";

// Services + Types
import { SourceCreateModal, SourceEditModal, SourceDeleteModal } from "../components/Modals/SourceModals";
import type { Source } from "@/types/source";

interface Column {
  key: string; // Allow nested key paths
  label: string;
}

const columns: Column[] = [
  { key: "source_name", label: "Source Name" },
  { key: "details.loc_name", label: "Location" },
  { key: "folder_path", label: "Folder Path" },
  { key: "file_keyword", label: "File Keyword" },
  { key: "file_type", label: "File Type" },
  { key: "source_type", label: "Source Type" },
  { key: "config", label: "Config" },
  { key: "last_updated", label: "Last Data Upload" },
  { key: "active", label: "Status" },
];

interface Props {
  sources: Source[];
}

export default function SourcesPageClient({ sources: initialSources }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const sources = initialSources;

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | undefined>();
  const [toDelete, setToDelete] = useState<Source | undefined>();

  // Colors
  const color   = "purple.600"
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Handlers
  const handleNew = () => { setSelectedSource(undefined); setCreateOpen(true); };
  const handleEdit = (s: Source) => { setSelectedSource(s); setEditOpen(true); };
  const handleDelete = (s: Source) => { setToDelete(s); setDelOpen(true); };

  // Hydration
  useEffect(() => {
    setHydrated(true);
    Promise.resolve().then(() => {
      toaster.create({
        description: "Sources loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      {hydrated? (
        <DataTable columns={columns} color={color} data={sources} onCreate={handleNew} onEdit={handleEdit} onDelete={handleDelete} name="sources" />
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
      <SourceCreateModal isOpen={isCreateOpen} onClose={() => { setSelectedSource(undefined); setCreateOpen(false); } } />
      <SourceEditModal isOpen={isEditOpen} source={selectedSource} onClose={() => { setSelectedSource(undefined); setEditOpen(false); }} />
      <SourceDeleteModal isOpen={isDelOpen} source={toDelete} onClose={() => { setToDelete(undefined); setDelOpen(false); }} />
    </Box>
  );
}
