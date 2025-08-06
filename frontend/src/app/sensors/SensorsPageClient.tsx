// File: app/sensors/components/SensorsPageClient.tsx
"use client";

// React + Next Imports
import { useEffect, useState } from "react";

// Chakra Imports + Icons
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster"
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from "chart.js";
import DataTable from "@/app/components/DataTable";

// Services + Types
import type { MonitoringSensor } from "@/types/sensor";
import { SensorCreateModal, SensorEditModal, SensorDeleteModal } from "../components/Modals/SensorModals";

// Register chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

// Column definition with label override
interface Column {
  key: string;
  label: string;
}

const columns: Column[] = [
  { key: 'sensor_name', label: 'Sensor Name' },
  { key: 'sensor_type', label: 'Sensor Type' },
  { key: 'details.mon_source_name', label: 'Source' },
  { key: 'sensor_group_id', label: 'Sensor Group' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'sensor data', label: 'Sensor Data'},
  { key: 'active', label: 'Active' },
];

interface Props {
  sensors: MonitoringSensor[];
}

export default function SensorsPageClient({ sensors: initialSensors }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const sensors = initialSensors;

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<MonitoringSensor | undefined>();
  const [toDelete, setToDelete] = useState<MonitoringSensor | undefined>();

  // Colors 
  const color   = "green.600"
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';

  // Handlers
  const handleNew = () => { setSelectedSensor(undefined); setCreateOpen(true); };
  const handleEdit = (s: MonitoringSensor) => { setSelectedSensor(s); setEditOpen(true); }
  const handleDelete = (s: MonitoringSensor) => { setToDelete(s); setDelOpen(true); }

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
        <DataTable columns={columns} color={color} data={sensors} onCreate={handleNew} onEdit={handleEdit} onDelete={handleDelete} name="sensors"/>
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
      
      <SensorCreateModal isOpen={isCreateOpen} onClose={() => { setSelectedSensor(undefined); setCreateOpen(false); } } />
      <SensorEditModal isOpen={isEditOpen} sensor={selectedSensor} onClose={() => { setSelectedSensor(undefined); setEditOpen(false); }} />
      <SensorDeleteModal isOpen={isDelOpen} sensor={toDelete} onClose={() => { setToDelete(undefined); setDelOpen(false); }} />
    </Box>
  );
}
