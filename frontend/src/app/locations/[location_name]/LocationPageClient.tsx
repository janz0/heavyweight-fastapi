"use client";

import 'leaflet/dist/leaflet.css';

import React, { useState, useEffect } from 'react';
import { Box, HStack, Heading, Text, VStack, Button, Popover, Flex, IconButton, Separator } from '@chakra-ui/react';
import { useColorMode } from '@/app/src/components/ui/color-mode';
import type { Location } from '@/types/location';
import type { MonitoringSensor } from '@/types/sensor';
import type { Source } from '@/types/source';
import { PencilSimple, Plus, Trash, Copy, DotsThreeVertical } from "phosphor-react";
import DataTable from '@/app/components/DataTable';
import { SourceCreateModal, SourceEditModal, SourceDeleteModal, SourceDuplicateModal } from '@/app/components/Modals/SourceModals';
import { SensorCreateModal, SensorEditModal, SensorDeleteModal, SensorDuplicateModal } from '@/app/components/Modals/SensorModals';
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
  initialLocation: Location;
  initialSources: Source[];
  initialSensors: MonitoringSensor[];
  initialGroups: MonitoringGroup[];
}

export default function LocationPageClient({ initialLocation, initialSources, initialSensors, initialGroups }: LocationPageClientProps) {
  const { colorMode } = useColorMode();
  const text = colorMode === "light" ? "gray.800" : "gray.200";
  const [activeTab, setActiveTab] = useState<'sources'|'sensors'|'groups'>('sources');
  const [location, setLocation] = useState<Location>(initialLocation);
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [sensors, setSensors] = useState<MonitoringSensor[]>(initialSensors);

  const [isGrpCreateOpen, setGrpCreateOpen] = useState(false);
  const [isGrpEditOpen, setGrpEditOpen] = useState(false);
  const [isGrpDelOpen, setGrpDelOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<MonitoringGroup | undefined>();
  const [grpToDelete, setGrpToDelete] = useState<MonitoringGroup | undefined>();
  const handleNewGrp = () => (setGrpCreateOpen(true));
  const handleEditGroup = (g: MonitoringGroup) => { setSelectedGroup(g); setGrpEditOpen(true); };
  const handleDeleteGroup = (g: MonitoringGroup) => { setGrpToDelete(g); setGrpDelOpen(true); };

  // Map controls
  const [isMapCollapsed, setMapCollapsed] = useState(false);
  const [isMapMaximized, setMapMaximized] = useState(false);
  const [mapHeight, setMapHeight] = useState<number>(400);
  const [prevMapHeight, setPrevMapHeight] = useState<number>(400);

  // Checklist controls
  const [isChecklistCollapsed, setChecklistCollapsed] = useState(false);
  const [isChecklistMaximized, setChecklistMaximized] = useState(false);
  const [isChecklistModalOpen, setChecklistModalOpen] = useState(false);
  const [hasChecklists, setHasChecklists] = useState<boolean | null>(null);

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
      if (!isChecklistCollapsed)
        maximizeChecklist();
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
            <Popover.Root positioning={{ placement: 'right', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
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
                      <LocationEditModal location={location}
                        trigger={
                          <Button variant="ghost" size="md" rounded="lg">
                            <PencilSimple />
                          </Button>
                        }
                        onEdited={(edited) => {
                          setLocation(edited);
                        }}
                      />
                      <LocationDeleteModal location={location}
                        trigger={
                          <Button variant="ghost" size="md" rounded="lg">
                            <Trash />
                          </Button>
                        }
                      />
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
        h={isChecklistMaximized ? "100%" : `${mapHeight}px + 10px)`}
        minH={`42px`}
        rounded={"md"}
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
          <Box
            position="absolute"
            top={0}
            right={0}
            w="20%"
            h="50px"
            opacity={0}
            _hover={{ opacity: 1 }}
            zIndex={1}
          >
            {/* map controls (top-right) */}
            <Flex position="absolute" top={1} right={1} gap={1} _focusWithin={{ opacity: 1 }}>
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
          </Box>
          <Box
            minH="10px"
            h={`${mapHeight}px`}
            overflow="hidden"
            aria-hidden={isMapCollapsed ? "true" : "false"}
            style={{
              opacity: isMapCollapsed ? 0 : 1,
              visibility: isMapCollapsed ? "hidden" : "visible",
              transition: `height ${MAP_EASE}, opacity 220ms ease,
                 visibility 0ms linear ${isMapCollapsed ? "220ms" : "420ms"}`
            }}
          >
            <LocationMap
              lat={location.lat}
              lon={location.lon}
              siteImageUrl='@/app/logoRWH.png'
              imageCoordinates={[
                [location.lon - 0.01, location.lat - 0.01],
                [location.lon + 0.01, location.lat - 0.01],
                [location.lon + 0.01, location.lat + 0.01],
                [location.lon - 0.01, location.lat + 0.01],
              ]}
            />
          </Box>
        </Box>

        {/* Checklist panel */}
        <Box
          className="bg-card"
          position="relative"
          flexShrink={0}
          flexGrow={0}
          flexBasis={isMapMaximized ? "0px" : isChecklistCollapsed ? `${COLLAPSED_RAIL}px` : "25%"}
          transition={"flex-basis 0.5s ease-in-out, min-height 0.5s ease-in-out, width 0.5s ease-in-out"}
          minW={"100px"}
          minH={isChecklistMaximized ? "70vh" : isChecklistCollapsed ? "0px" : mapHeight == 0 ? prevMapHeight : mapHeight}
          display={isMapMaximized ? "none" : "block"}
        >
          <Box
            position="absolute"
            top={0}
            right={0}
            w={"inherit"}
            h="40px"
            bg="transparent"
            opacity={0}
            _hover={{ opacity: 1 }}
            zIndex={1}
          >
            {/* checklist controls (top-right) */}
            <Flex position="absolute" top={1} right={isChecklistCollapsed ? 1 : 5} zIndex={1} gap={1} transition="right 500ms ease">
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
          </Box>
          <Box
            position="absolute"
            inset={0}
            mb={4}
            opacity={isChecklistCollapsed ? 0 : 1}
            transform={isChecklistCollapsed ? "translateX(8px)" : "translateX(0)"}
            transition={
              isChecklistCollapsed
                ? "opacity 320ms ease, transform 600ms ease"
                : "opacity 700ms ease 720ms, transform 660ms ease 400ms"
            }
            pointerEvents={isChecklistCollapsed ? "none" : "auto"}
            aria-hidden={isChecklistCollapsed ? "true" : "false"}
          >
            <Box overflow="hidden" overflowY={"auto"} h="100%">
              {hasChecklists === false ? (
                <Flex h="100%" align="center" justify="center">
                  <Button
                    className="add-button"
                    onClick={() => setChecklistModalOpen(true)}
                    size={{base: "sm", lg:"md"}}
                  >
                    Add checklist
                  </Button>
                </Flex>
              ) : (
                // NORMAL STATE
                <Box>
                  <ChecklistViewer
                    locationId={location.id}
                    onChecklistCountChange={(count) => setHasChecklists(count > 0)}
                  />
                </Box>
              )}
            </Box>
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
          _dark={{color: "white"}}
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
          _dark={{color: "white"}}
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
          _dark={{color: "white"}}
          w="25%"
        >
          Groups
        </Button>
      </HStack>
      {activeTab === 'sources' && (
        <DataTable columns={sourcesColumns} color={"purple.600"} data={sources} name={activeTab}
          createElement={
            <SourceCreateModal projectId={location.project_id}
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setSources(prev => [created, ...prev]);
              }}
            />
          }
          editElement={(item) => (
            <SourceEditModal source={item} projectId={location.project_id}
              trigger={
                <Button variant="ghost" size="md" rounded="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setSources(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
              }}
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
                setSources(prev => prev.filter(p => p.id !== id));
              }}
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
                setSources(prev => [duplicated, ...prev]);
              }}
            />
          )}
        />
      )}

      {activeTab === 'sensors' && (
        <DataTable columns={sensorColumns} color={"green.600"} data={sensors} name={activeTab}
          createElement={
            <SensorCreateModal projectId={location.project_id}
              trigger={
                <Button borderRadius="0.375rem" boxShadow="sm" bg="orange" color="black" size="sm">
                  <Plus /> Add New
                </Button>
              }
              onCreated={(created) => {
                setSensors(prev => [created, ...prev]);
              }}
            />
          }
          editElement={(item) => (
            <SensorEditModal sensor={item} projectId={location.project_id}
              trigger={
                <Button variant="ghost" size="md">
                  <PencilSimple />
                </Button>
              }
              onEdited={(edited) => {
                setSensors(prev => prev.map(p => p.id === edited.id ? { ...p, ...edited } : p));
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
                setSensors(prev => prev.filter(p => p.id !== id));
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
                setSensors(prev => [duplicated, ...prev]);
              }}
            />
          )}
        />
      )}

      {activeTab === 'groups' && (
        <DataTable columns={groupColumns} data={initialGroups} onCreate={handleNewGrp} onEdit={handleEditGroup} onDelete={handleDeleteGroup} name={activeTab} />
      )}

      <MonitoringGroupCreateModal isOpen={isGrpCreateOpen} onClose={() => setGrpCreateOpen(false)} locationId={location.id} />
      <MonitoringGroupEditModal isOpen={isGrpEditOpen} group={selectedGroup} onClose={() => { setGrpEditOpen(false); setSelectedGroup(undefined); }}/>
      <MonitoringGroupDeleteModal isOpen={isGrpDelOpen} group={grpToDelete} onClose={() => { setGrpDelOpen(false); setGrpToDelete(undefined); }}/>
      <ChecklistCreateModal
        isOpen={isChecklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        locationId={location.id}
      />
    </Box>
  );
}
