// File: app/sensors/components/SensorsPageClient.tsx
"use client";

// React + Next Imports
import { useEffect, useState } from "react";

// Chakra Imports + Icons
import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster"
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from "chart.js";
import DataTable from "@/app/components/DataTable";

// Services + Types
import type { MonitoringSensor } from "@/types/sensor";
import { SensorCreateModal, SensorEditModal, SensorDeleteModal, SensorDuplicateModal } from "../components/Modals/SensorModals";
import { sensorColumns } from "@/types/columns";

import { PencilSimple, Plus, Trash, Copy } from "phosphor-react";

// Register chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface Props {
  sensors: MonitoringSensor[];
}

export default function SensorsPageClient({ sensors: initialSensors }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<MonitoringSensor[]>(initialSensors);

  // Colors 
  const color   = "green.600"
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Hydration
  useEffect(() => {
    setHydrated(true);
    Promise.resolve().then(() => {
      toaster.create({
        description: "Sensors loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      {hydrated? (
        <DataTable columns={sensorColumns} color={color} data={items} name="sensors" 
          createElement={
            <SensorCreateModal
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setItems(prev => [created, ...prev]);
              }}
            />
          }
          editElement={(item) => (
            <SensorEditModal sensor={item}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setItems(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
              }}
            />
          )}
          deleteElement={(item) => (
            <SensorDeleteModal sensor={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Trash />
                </Button>
              }
              onDeleted={(id) => {
                setItems(prev => prev.filter(p => p.id !== id));
              }}
            />
          )}
          duplicateElement={(item) => (
            <SensorDuplicateModal sensor={item}
              trigger={
                <Button variant="ghost" size="md">
                  <Copy />
                </Button>
              }
              onDuplicated={(duplicated) => {
                setItems(prev => [duplicated, ...prev]);
              }}
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
