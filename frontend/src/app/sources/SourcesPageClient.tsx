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
import { SourceCreateModal, SourceEditModal, SourceDeleteModal, SourceDuplicateModal } from "../components/Modals/SourceModals";
import type { Source } from "@/types/source";
import { sourcesColumns } from "@/types/columns";

interface Props {
  sources: Source[];
}

export default function SourcesPageClient({ sources: initialSources }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Source[]>(initialSources);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [isDupOpen, setDupOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<Source | undefined>();
  const [selectedSource, setSelectedSource] = useState<Source | undefined>();
  const [toDelete, setToDelete] = useState<Source | undefined>();

  // Colors
  const color   = "purple.600"
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Handlers
  const handleNew = () => { setSelectedSource(undefined); setCreateOpen(true); };
  const handleEdit = (s: Source) => { setSelectedSource(s); setEditOpen(true); };
  const handleDelete = (s: Source) => { setToDelete(s); setDelOpen(true); };
  const handleDuplicate = (s: Source) => { setDuplicateSource(s); setDupOpen(true); };

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
        <DataTable columns={sourcesColumns} color={color} data={items} onCreate={handleNew} onEdit={handleEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} name="sources" />
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
      <SourceCreateModal
        isOpen={isCreateOpen}
        onClose={() => { setSelectedSource(undefined); setCreateOpen(false); } }
        onCreated={(created) => {
          setItems(prev => [created, ...prev]);
        }}
      />
      <SourceEditModal
        isOpen={isEditOpen}
        source={selectedSource}
        onClose={() => { setSelectedSource(undefined); setEditOpen(false); }}
        onEdited={(edited) => {
          setItems(prev => prev.map(s => s.id === edited.id ? { ...s, ...edited } : s ));
        }}
      />
      <SourceDeleteModal
        isOpen={isDelOpen}
        source={toDelete}
        onClose={() => { setToDelete(undefined); setDelOpen(false); }}
        onDeleted={(id) => {
          setItems(prev => prev.filter(s => s.id !== id));
        }}
      />
      <SourceDuplicateModal 
        isOpen={isDupOpen}
        source={duplicateSource}
        onClose={() => {setDuplicateSource(undefined); setDupOpen(false); }}
        onDuplicated={(duplicated) => {
          setItems(prev => [duplicated, ...prev]);
        }}
      />
    </Box>
  );
}
