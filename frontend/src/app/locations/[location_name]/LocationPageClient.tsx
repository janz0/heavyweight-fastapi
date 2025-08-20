"use client";

import 'leaflet/dist/leaflet.css';

import React, { useState, useEffect } from 'react';
import { Box, HStack, Heading, Text, VStack, Button, Popover, Flex, IconButton, Separator } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import type { Location } from '@/types/location';
import type { MonitoringSensor } from '@/types/sensor';
import type { Source } from '@/types/source';
//import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { PencilSimple, Trash, DotsThreeVertical } from "phosphor-react";
import DataTable from '@/app/components/DataTable';
import { SourceCreateModal, SourceEditModal, SourceDeleteModal } from '@/app/components/Modals/SourceModals';
import { SensorCreateModal, SensorEditModal, SensorDeleteModal } from '@/app/components/Modals/SensorModals';
import { MonitoringGroupCreateModal, MonitoringGroupEditModal, MonitoringGroupDeleteModal } from '@/app/components/Modals/MonitoringGroupModals';
import { listMonitoringGroups } from '@/services/monitoringGroups';
import type { MonitoringGroup } from '@/types/monitoringGroup';
import { LocationEditModal, LocationDeleteModal } from '../../components/Modals/LocationModals';
import ChecklistViewer from '@/app/components/CheckListViewer';
import { LocationMap } from '@/app/components/LocationMap';
interface LocationPageClientProps {
  location: Location;
  initialSources: Source[];
  initialSensors: MonitoringSensor[];
  initialGroups: MonitoringGroup[];
}

interface Column {
  key: string;
  label: string;
}

const sourcesColumns: Column[] = [
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

const sensorColumns: Column[] = [
  { key: 'sensor_name', label: 'Sensor Name' },
  { key: 'sensor_type', label: 'Sensor Type' },
  { key: 'mon_source_id', label: 'Source' },
  { key: 'sensor_group_id', label: 'Sensor Group' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'sensor data', label: 'Sensor Data'},
  { key: 'active', label: 'Active' },
];

const groupColumns: Column[] = [
  { key: 'group_name', label: 'Group Name' },
  { key: 'group_type', label: 'Group Type' },
  { key: 'data', label: 'Data' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'active', label: 'Active' },
];

export default function LocationPageClient({ location, initialSources, initialSensors, initialGroups }: LocationPageClientProps) {
  const { colorMode } = useColorMode();
  const text = colorMode === "light" ? "gray.800" : "gray.200";
  const [activeTab, setActiveTab] = useState<'sources'|'sensors'|'groups'>('sources');

  // Source Variables
  const [isSrcCreateOpen, setSrcCreateOpen] = useState(false);
  const [isSrcEditOpen, setSrcEditOpen] = useState(false);
  const [isSrcDelOpen, setSrcDelOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | undefined>();
  const [srcToDelete, setSrcToDelete] = useState<Source | undefined>();
  const handleNewSource = () => { setSelectedSource(undefined); setSrcCreateOpen(true); };
  const handleEditSource = (s: Source) => { setSelectedSource(s); setSrcEditOpen(true); };
  const handleDeleteSource = (s: Source) => { setSrcToDelete(s); setSrcDelOpen(true); };

  // Sensor Variables
  const [isSenCreateOpen, setSenCreateOpen] = useState(false);
  const [isSenEditOpen, setSenEditOpen] = useState(false);
  const [isSenDelOpen, setSenDelOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<MonitoringSensor | undefined>();
  const [senToDelete, setSenToDelete] = useState<MonitoringSensor | undefined>();
  const handleNewSensor = () => { setSelectedSensor(undefined); setSenCreateOpen(true); };
  const handleEditSensor = (s: MonitoringSensor) => { setSelectedSensor(s); setSenEditOpen(true); };
  const handleDeleteSensor = (s: MonitoringSensor) => { setSenToDelete(s); setSenDelOpen(true); };
  
  const [isLocEditOpen, setLocEditOpen] = useState(false);
  const [isLocDelOpen, setLocDelOpen] = useState(false);
  const handleEditLocation = () => {setLocEditOpen(true); setPopoverOpen(false)};
  const handleDeleteLocation = () => {setLocDelOpen(true); setPopoverOpen(false)};

  const [isGrpCreateOpen, setGrpCreateOpen] = useState(false);
  const [isGrpEditOpen, setGrpEditOpen] = useState(false);
  const [isGrpDelOpen, setGrpDelOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<MonitoringGroup | undefined>();
  const [grpToDelete, setGrpToDelete] = useState<MonitoringGroup | undefined>();
  const [locationGroups, setLocationGroups] = useState<MonitoringGroup[]>([])
  const handleNewGrp = () => (setGrpCreateOpen(true));
  const handleEditGroup = (g: MonitoringGroup) => { setSelectedGroup(g); setGrpEditOpen(true); };
  const handleDeleteGroup = (g: MonitoringGroup) => { setGrpToDelete(g); setGrpDelOpen(true); };
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    listMonitoringGroups(location.id)
      .then(setLocationGroups)
      .catch(err => {
        console.error("Could not load groups:", err)
      })
  }, [location.id])
  console.log(locationGroups);

  function formatDate(dateString?: string | null) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day:   'numeric',
      year:  'numeric',
    }).format(date);
  }

  return (
    <Box px={4} py={{base: "2", md: "2"}} color={text}>
      <Flex mb={4} align="flex-start" position="relative" w="100%" direction="column">
        <Heading fontSize="3xl">  
          <Text as="span" color="blue.600">
            {location.loc_name.charAt(0)}
          </Text>
          <Text as="span" fontSize="lg" fontWeight="bold" color="blue.600">
            {location.loc_name.slice(1)}
          </Text>
          <Text as="span" ml={2} fontSize="md" fontWeight={"extralight"}>
            {location.loc_number}
          </Text>
          <Box
            display="inline-block"
            boxSize="14px"
            borderRadius="full"
            ml="2"
            bg={location.active ? "green.400" : "red.400"}
          />
          <Box display={"inline-block"}>
            <Popover.Root positioning={{ placement: 'right', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}} autoFocus={false} open={isPopoverOpen} onOpenChange={() => setPopoverOpen(true)}>
              <Popover.Trigger asChild>
                <IconButton as={DotsThreeVertical} aria-label="More actions" variant="ghost" size="2xs" color="black" borderRadius="full" ml={2}
                  onClick={(e) => e.stopPropagation()}
                  _hover={{
                    backgroundColor: 'blackAlpha.300',
                  }}
                  _dark={{
                    color: "white",
                    _hover: {backgroundColor: "whiteAlpha.200"}
                  }}
                />
              </Popover.Trigger>
              <Popover.Positioner>
                <Popover.Content width="64px" height="100px" borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                  <Popover.Arrow>
                    <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1} _dark={{borderColor: "whiteAlpha.600"}}/>
                  </Popover.Arrow>
                  <Popover.Body height="100px" p={0} >
                    <VStack gap={0} justifyContent={"center"} height="inherit">
                      <Button variant="ghost" size="md" onClick={handleEditLocation}>
                        <PencilSimple />
                      </Button>
                      <Button variant="ghost" size="md" onClick={handleDeleteLocation}>
                        <Trash />
                      </Button>
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          </Box>
        </Heading>
        <Text as="span" fontSize="md" color="orange.600">
          {location.details?.project_name||"N/A"}
        </Text>
        <Box position="absolute" left={"50%"} transform="translateX(-50%)" textAlign={"center"}>
          <Text>
            {formatDate(location.created_at)}
          </Text>
          <Text as="span" fontSize="md">
            {location.lat}&nbsp;&nbsp;{location.lon}
          </Text>
        </Box>
        <Box position="absolute" right="0" textAlign={"right"}>
          <Flex justify="space-between">
            <Text fontSize="sm">Last Updated:</Text>
            <Text fontSize="sm" pl={2}>{formatDate(location.last_updated)}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontSize="sm">Last Inspected:</Text>
            <Text fontSize="sm">{location.last_inspected || "N/A"}</Text>
          </Flex>
        </Box>
      </Flex>
      <HStack mb={3} h="50vh" align="stretch">
        <Box className="bg-card" w="50%" overflow={"hidden"}>
            <LocationMap
              lat={location.lat}
              lon={location.lon}
              siteImageUrl="/your-site-photo.jpg" // or location.site_image if you store it
              imageCoordinates={[
                [location.lon - 0.01, location.lat - 0.01],
                [location.lon + 0.01, location.lat - 0.01],
                [location.lon + 0.01, location.lat + 0.01],
                [location.lon - 0.01, location.lat + 0.01],
              ]}
              initialMarkers={[[location.lon, location.lat]]}
            />
        </Box>
        <Box className='bg-card' w="full">
          <ChecklistViewer locationId={location.id} />
        </Box>
      </HStack>
      <Separator variant="solid" size="lg" marginY="6" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'} />
      <HStack mb={4} gap={4} justifyContent={"center"}>
        <Button
          variant={activeTab === 'sources' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab("sources")}
          borderWidth={"2px"}
          borderColor={"purple.600"}
          bg={activeTab === 'sources' ? 'rgba(194, 213, 255, 0.40)' : 'undefined'}
          color={"black"}
          _dark={{borderColor: "white"}}
          w="25%"
        >
          Sources
        </Button>
        <Button
          variant={activeTab === 'sensors' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab("sensors")}
          borderWidth={"2px"}
          borderColor={"green.600"}
          bg={activeTab === 'sensors' ? 'rgba(194, 213, 255, 0.40)' : 'undefined'}
          color={"black"}
          _dark={{borderColor: "white"}}
          w="25%"
        >
          Sensors
        </Button>
        <Button
          variant={activeTab === 'groups' ? 'solid' : 'ghost'}
          onClick={() => setActiveTab("groups")}
          borderWidth={"2px"}
          borderColor={"black"}
          bg={activeTab === 'groups' ? 'rgba(194, 213, 255, 0.40)' : 'undefined'}
          color={"black"}
          _dark={{borderColor: "white"}}
          w="25%"
        >
          Groups
        </Button>
      </HStack>
      {activeTab === 'sources' && (
        <DataTable columns={sourcesColumns} color={"purple.600"} data={initialSources} onCreate={handleNewSource} onEdit={handleEditSource} onDelete={handleDeleteSource} name={activeTab} />
      )}

      {activeTab === 'sensors' && (
        <DataTable columns={sensorColumns} color={"green.600"} data={initialSensors} onCreate={handleNewSensor} onEdit={handleEditSensor} onDelete={handleDeleteSensor} name={activeTab} />
      )}

      {activeTab === 'groups' && (
        <DataTable columns={groupColumns} data={initialGroups} onCreate={handleNewGrp} onEdit={handleEditGroup} onDelete={handleDeleteGroup} name={activeTab} />
      )}

      <SourceCreateModal isOpen={isSrcCreateOpen} onClose={() => { setSrcCreateOpen(false); setSelectedSource(undefined);  } } />
      <SourceEditModal isOpen={isSrcEditOpen} source={selectedSource} onClose={() => { setSrcEditOpen(false); setSelectedSource(undefined);  }} />
      <SourceDeleteModal isOpen={isSrcDelOpen} source={srcToDelete} onClose={() => { setSrcDelOpen(false); setSrcToDelete(undefined);  }} />
      <SensorCreateModal isOpen={isSenCreateOpen} onClose={() => { setSenCreateOpen(false); setSelectedSensor(undefined);  } } />
      <SensorEditModal isOpen={isSenEditOpen} sensor={selectedSensor} onClose={() => { setSenEditOpen(false); setSelectedSensor(undefined);  }} />
      <SensorDeleteModal isOpen={isSenDelOpen} sensor={senToDelete} onClose={() => { setSenDelOpen(false); setSenToDelete(undefined);  }} />
      <MonitoringGroupCreateModal isOpen={isGrpCreateOpen} onClose={() => setGrpCreateOpen(false)} locationId={location.id} />
      <MonitoringGroupEditModal isOpen={isGrpEditOpen} group={selectedGroup} onClose={() => { setGrpEditOpen(false); setSelectedGroup(undefined); }}/>
      <MonitoringGroupDeleteModal isOpen={isGrpDelOpen} group={grpToDelete} onClose={() => { setGrpDelOpen(false); setGrpToDelete(undefined); }}/>
      <LocationEditModal isOpen={isLocEditOpen} location={location} onClose={() => { setLocEditOpen(false); }} />
      <LocationDeleteModal isOpen={isLocDelOpen} location={location} onClose={() => { setLocDelOpen(false); }} />
    </Box>
  );
}
