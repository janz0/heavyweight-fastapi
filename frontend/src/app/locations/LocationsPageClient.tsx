// File: app/locations/components/LocationsPageClient.tsx
"use client";

// React Imports
import { useEffect, useState } from "react";

// Chakra Imports
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import DataTable from "@/app/components/DataTable";

// Modals
import { LocationCreateModal, LocationDeleteModal, LocationEditModal } from "../components/Modals/LocationModals";

// Types
import type { Location } from "@/types/location";

// Column definition with label override
interface Column {
  key: string;
  label: string;
}

const columns: Column[] = [
  { key: 'loc_name', label: 'Location Name' },
  { key: 'loc_number', label: 'Location Number' },
  { key: 'details.project_name', label: 'Project' },
  { key: 'lat', label: 'Latitude' },
  { key: 'lon', label: 'Longitude' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'frequency', label: 'Frequency' },
  { key: "active", label: 'Status' },
];

interface Props {
  locations: Location[];
}

export default function LocationsPageClient({ locations: initialLocations }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const locations = initialLocations;

  // useState CRUD
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [toDelete, setToDelete] = useState<Location | undefined>();

  // Colors
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Handlers
  const handleNew = () => { setSelectedLocation(undefined); setCreateOpen(true); };
  const handleEdit = (l: Location) => { setSelectedLocation(l); setEditOpen(true); };
  const handleDelete = (l: Location) => { setToDelete(l); setDelOpen(true); };

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
        <DataTable columns={columns} color={"blue.600"} data={locations} onCreate={handleNew} onEdit={handleEdit} onDelete={handleDelete} name="locations"/>
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
      <LocationCreateModal isOpen={isCreateOpen} onClose={() => { setSelectedLocation(undefined); setCreateOpen(false);}} />
      <LocationEditModal isOpen={isEditOpen} location={selectedLocation} onClose={() => { setSelectedLocation(undefined); setEditOpen(false); }} />
      <LocationDeleteModal isOpen={isDelOpen} onClose={() => { setToDelete(undefined); setDelOpen(false); }} location={toDelete} />
    </Box>
  );
}
