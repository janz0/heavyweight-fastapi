// File: app/locations/components/LocationsPageClient.tsx
"use client";

// React Imports
import { useEffect, useState } from "react";

// Chakra Imports
import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import DataTable from "@/app/components/DataTable";

// Modals
import { LocationCreateModal, LocationDeleteModal, LocationEditModal, LocationDuplicateModal } from "../components/Modals/LocationModals";

// Types
import type { Location } from "@/types/location";
import { locationColumns } from "@/types/columns";

import { PencilSimple, Plus, Trash, Copy } from "phosphor-react";

interface Props {
  locations: Location[];
  authToken: string;
}

export default function LocationsPageClient({ locations: initialLocations, authToken: authToken }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Location[]>(initialLocations);

  // Colors
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Hydration
  useEffect(() => {
    setHydrated(true);
    Promise.resolve().then(() => {
      toaster.create({
        description: "Locations loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      {hydrated? (
        <DataTable columns={locationColumns} color={"blue.600"} data={items} name="locations"
          createElement={
            <LocationCreateModal
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
            <LocationEditModal location={item}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setItems(prev => prev.map(l => l.id === edited.id ? { ...l, ...edited } : l));
              }}
              authToken={authToken}
            />
          )}
          deleteElement={(item) => (
            <LocationDeleteModal location={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Trash />
                </Button>
              }
              onDeleted={(id) => {
                setItems(prev => prev.filter(l => l.id !== id));
              }}
              authToken={authToken}
            />
          )}
          duplicateElement={(item) => (
            <LocationDuplicateModal location={item}
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
