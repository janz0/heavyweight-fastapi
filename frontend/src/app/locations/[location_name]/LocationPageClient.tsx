"use client";

import 'leaflet/dist/leaflet.css';

import React, { useState, useEffect } from 'react';
import { Box, HStack, Heading, Text, VStack, Button, Popover, Flex, IconButton, Separator, Collapsible } from '@chakra-ui/react';
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
import type { MonitoringGroup } from '@/types/monitoringGroup';
import { LocationEditModal, LocationDeleteModal } from '../../components/Modals/LocationModals';
import ChecklistViewer from '@/app/components/CheckListViewer';
import { LocationMap } from '@/app/components/UI/LocationMap';
import { ChecklistCreateModal } from '@/app/components/Modals/ChecklistCreateModal';
import { sourcesColumns, sensorColumns, groupColumns } from '@/types/columns';
import { Tooltip } from '@/app/src/components/ui/tooltip';
import { Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";


interface LocationPageClientProps {
  location: Location;
  initialSources: Source[];
  initialSensors: MonitoringSensor[];
  initialGroups: MonitoringGroup[];
}

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
  const handleNewGrp = () => (setGrpCreateOpen(true));
  const handleEditGroup = (g: MonitoringGroup) => { setSelectedGroup(g); setGrpEditOpen(true); };
  const handleDeleteGroup = (g: MonitoringGroup) => { setGrpToDelete(g); setGrpDelOpen(true); };
  const [isPopoverOpen, setPopoverOpen] = useState(false);

    // Map controls
  const [isMapCollapsed, setMapCollapsed] = useState(false);
  const [isMapMaximized, setMapMaximized] = useState(false);
  const [mapHeight, setMapHeight] = useState<number>(400);
  const [prevMapHeight, setPrevMapHeight] = useState<number>(400);

  // Checklist controls
  const [isChecklistCollapsed, setChecklistCollapsed] = useState(false);
  const [isChecklistMaximized, setChecklistMaximized] = useState(false);
  const [isChecklistModalOpen, setChecklistModalOpen] = useState(false);
  // initialize map height to ~50% viewport (client-side)
  useEffect(() => {
    const h = Math.round(window.innerHeight * 0.5);
    setMapHeight(h);
    setPrevMapHeight(h);
  }, []);

  const setMapHeightSmooth = (next: number) => {
    requestAnimationFrame(() => setMapHeight(next));
  };

  const minimizeMap = () => {
    if (!isMapCollapsed) {
      setPrevMapHeight(mapHeight || 400);
      setMapCollapsed(true);
      setMapMaximized(false);
      setMapHeightSmooth(0);
      
    }
  };
  const restoreMap = () => {
    setMapCollapsed(false);
    setMapMaximized(false);
    setMapHeightSmooth(prevMapHeight || 400);
  };
  const maximizeMap = () => {
    setPrevMapHeight(mapHeight || 400);
    setMapCollapsed(false);
    setMapMaximized(true);
    setChecklistMaximized(false);
    setMapHeightSmooth(Math.round(window.innerHeight * 0.7));
    
  };

  const minimizeChecklist = () => {
    setChecklistCollapsed(true);
    setChecklistMaximized(false);
  };
  const restoreChecklist = () => {
    setChecklistCollapsed(false);
    setChecklistMaximized(false);
  };
  const maximizeChecklist = () => {
    setChecklistCollapsed(false);
    setChecklistMaximized(true);
    // hide map while checklist is maximized
    setMapMaximized(false);
  };
  function formatDate(dateString?: string | null) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day:   'numeric',
      year:  'numeric',
    }).format(date);
  }

  const COLLAPSED_RAIL = 80;
  const MAP_EASE = "320ms ease-in-out"; // same both ways
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
      <Flex
        mb={3}
        align="stretch"
        gap={3}
        direction={isMapMaximized || isChecklistMaximized ? "column" : "row"}
        overflow={"hidden"}
        h={`${mapHeight}px + 10px)`}
        minH={`42px`}
      >
        {/* Map panel */}
        <Box
          className="bg-card"
          position="relative"
          flex="1 1 auto"
          minW={0}
          h="100%"
          overflow="hidden"
          display={isChecklistMaximized ? "none" : "block"}
        >
          {/* map controls (top-right) */}
          <Flex position="absolute" top={1} right={1} gap={1} zIndex={1}>
            {isMapCollapsed ? (
              <Tooltip content="Restore map">
                <IconButton aria-label="Restore map" size="xs" bg="bg.subtle" variant="ghost" onClick={restoreMap}>
                  <ChevronDown />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip content="Minimize map">
                <IconButton aria-label="Minimize map" size="xs" bg="bg.subtle" variant="ghost" onClick={minimizeMap}>
                  <ChevronUp />
                </IconButton>
              </Tooltip>
            )}
            {!isMapMaximized ? (
              <Tooltip content="Maximize map">
                <IconButton aria-label="Maximize map" size="xs" bg="bg.subtle" variant="ghost" onClick={maximizeMap}>
                  <Maximize2 />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip content="Restore map size">
                <IconButton aria-label="Restore map size" size="xs" bg="bg.subtle" variant="ghost" onClick={restoreMap}>
                  <Minimize2 />
                </IconButton>
              </Tooltip>
            )}
          </Flex>

          {/* collapsible map content */}
          <Collapsible.Root open={!isMapCollapsed} minH="10px">
            <Collapsible.Content>
              <Box h={`${mapHeight}px`} transition={`height ${MAP_EASE}`}>
                <LocationMap
                  lat={location.lat}
                  lon={location.lon}
                  siteImageUrl="/your-site-photo.jpg"
                  imageCoordinates={[
                    [location.lon - 0.01, location.lat - 0.01],
                    [location.lon + 0.01, location.lat - 0.01],
                    [location.lon + 0.01, location.lat + 0.01],
                    [location.lon - 0.01, location.lat + 0.01],
                  ]}
                />
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        {/* Checklist panel */}
        <Box
          className="bg-card"
          position="relative"
          flexShrink={0}
          flexGrow={0}
          flexBasis={isMapMaximized ? "0px" : isChecklistCollapsed ? `${COLLAPSED_RAIL}px` : "25%"}
          transition={"flex-basis 0.5s ease-in-out, min-height 0.5s ease-in-out"}
          minH={isChecklistCollapsed || isMapMaximized ? "0px" : "250px"}
          display={isMapMaximized ? "none" : "block"}
        >
          {/* checklist controls (top-right) */}
          <Flex position="absolute" top={1} right={1} gap={1} zIndex={1}>
            {isChecklistCollapsed ? (
              <Tooltip content="Restore checklist">
                <IconButton aria-label="Restore checklist" size="xs" variant="ghost" bg="bg.subtle" onClick={restoreChecklist}>
                  <ChevronDown />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip content="Minimize checklist">
                <IconButton aria-label="Minimize checklist" size="xs" variant="ghost" bg="bg.subtle" onClick={minimizeChecklist}>
                  <ChevronUp />
                </IconButton>
              </Tooltip>
            )}
            {!isChecklistMaximized ? (
              <Tooltip content="Maximize checklist">
                <IconButton aria-label="Maximize checklist" size="xs" variant="ghost" bg="bg.subtle" onClick={maximizeChecklist}>
                  <Maximize2 />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip content="Restore checklist width">
                <IconButton aria-label="Restore checklist width" size="xs" variant="ghost" bg="bg.subtle" onClick={restoreChecklist}>
                  <Minimize2 />
                </IconButton>
              </Tooltip>
            )}
          </Flex>

          <Box
            position="absolute"
            inset={0}
            overflowY="auto"
            // smooth text appearance
            opacity={isChecklistCollapsed ? 0 : 1}
            transform={isChecklistCollapsed ? "translateX(8px)" : "translateX(0)"}
            // fade in a touch after width starts expanding; fade out immediately when collapsing
            transition={
              isChecklistCollapsed
                ? "opacity 320ms ease, transform 600ms ease"
                : "opacity 700ms ease 720ms, transform 660ms ease 400ms"
            }
            pointerEvents={isChecklistCollapsed ? "none" : "auto"}
            aria-hidden={isChecklistCollapsed ? "true" : "false"}
          >
            {/* Keep it mounted; avoid display:none while animating width */}
            {/* If your Collapsible unmounts by default, pass forceMount (Radix) or just remove it. */}
            {/* <Collapsible.Root open> ... </Collapsible.Root> */}
            <ChecklistViewer locationId={location.id} />
          </Box>
        </Box>
      </Flex>
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
      <Button
        colorScheme="yellow"
        onClick={() => setChecklistModalOpen(true)}
      >
        Add Checklist
      </Button>
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
      <ChecklistCreateModal
        isOpen={isChecklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        locationId={location.id}
      />
    </Box>
  );
}
