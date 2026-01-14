// File: app/sources/components/SourcesPageClient.tsx
"use client";

// React + Next Imports
import { useState, useEffect } from "react";

// Chakra Imports + Icons
import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import DataTable from "@/app/components/DataTable";

// Services + Types
import { SourceCreateModal, SourceEditModal, SourceDeleteModal, SourceDuplicateModal } from "../components/Modals/SourceModals";
import type { Source } from "@/types/source";
import { sourcesColumns } from "@/types/columns";

import { PencilSimple, Plus, Trash, Copy } from "phosphor-react";

interface Props {
  sources: Source[];
  authToken: string;
}

export default function SourcesPageClient({ sources: initialSources, authToken: authToken }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Source[]>(initialSources);

  // Colors
  const color   = "purple.600"
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

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
        <DataTable columns={sourcesColumns} color={color} data={items} name="sources"
          createElement={
            <SourceCreateModal
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setItems(prev => [created, ...prev]);
              }}
              authToken={authToken}
            />
          }
          editElement={(item) => (
            <SourceEditModal source={item}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setItems(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
              }}
              authToken={authToken}
            />
          )}
          deleteElement={(item) => (
            <SourceDeleteModal source={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Trash />
                </Button>
              }
              onDeleted={(id) => {
                setItems(prev => prev.filter(p => p.id !== id));
              }}
              authToken={authToken}
            />
          )}
          duplicateElement={(item) => (
            <SourceDuplicateModal source={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Copy />
                </Button>
              }
              onDuplicated={(duplicated) => {
                setItems(prev => [duplicated, ...prev]);
              }}
              authToken={authToken}
            />
          )}
        />
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
    </Box>
  );
}
