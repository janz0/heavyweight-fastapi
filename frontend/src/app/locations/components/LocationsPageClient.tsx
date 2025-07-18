// File: app/locations/components/LocationsPageClient.tsx
"use client";

// React + Next Imports
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Chakra Imports + Icons
import { Box, Button, Flex, Heading, IconButton, Popover, Spinner, Table, Text, VStack } from "@chakra-ui/react";
import { PencilSimple, Trash, DotsThreeVertical, Plus, MagnifyingGlass } from "phosphor-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import SearchInput from "@/app/components/SearchInput";
import PageSizeSelect from "@/app/components/PageSizeSelect";
import DataTable from "@/app/components/DataTable";
//import CountFooter from "@/app/components/CountFooter";

// Services + Types
import { LocationCreateModal, LocationDeleteModal, LocationEditModal } from "./LocationModals";
import type { Location } from "@/types/location";

// Column definition with label override
interface Column {
  key: string;
  label: string;
}

const columns: Column[] = [
  { key: 'loc_name', label: 'Location Name' },
  { key: 'loc_number', label: 'Location Number' },
  { key: 'project_id', label: 'Project' },
  { key: 'lat', label: 'Latitude' },
  { key: 'lon', label: 'Longitude' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'last_inspected', label: 'Inspected' },
  { key: "active", label: 'Status' },
];

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

interface Props {
  locations: Location[];
}

export default function LocationsPageClient({ locations: initialLocations }: Props) {
  const { colorMode } = useColorMode();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc"|"desc" }|null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [toDelete, setToDelete] = useState<Location | undefined>();

  const locations = initialLocations;
  const pageSizeOptions = [10, 25, 50, 100];

  // Colors
  const bg      = colorMode === 'light' ? 'gray.300' : '#111111';
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const filtered = useMemo(() => locations.filter(l => l.loc_name.toLowerCase().includes(search.toLowerCase())), [search, locations]);
  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const { key, direction } = sortConfig;
    return [...filtered].sort((a,b) => {
      const av = getNestedValue(a, key), bv = getNestedValue(b, key);
      if (av == null || bv == null) return av==null? -1:1;
      if (typeof av === "number" && typeof bv === "number")
        return direction==="asc"? av-bv : bv-av;
      return direction==="asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortConfig]);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const displayed = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Handlers
  const handleNew = () => { setSelectedLocation(undefined); setCreateOpen(true); };
  const handleEdit = (l: Location) => { setSelectedLocation(l); setEditOpen(true); };
  const handleDelete = (l: Location) => { setToDelete(l); setDelOpen(true); };

  const requestSort = (key: string) => {
    setSortConfig(sc =>
      sc?.key===key && sc.direction==="asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" }
    );
  };

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
    <Box minH="100vh" bg={bg} p={6} color={text}>
      {/* Header Row */}
      <Flex mb={4} align="center" position="relative" w="100%">
        <Heading fontSize="3xl">Locations</Heading>
        <Flex ml="auto" align="center" gap={4}>
          <Box minW="20ch" display={{base: "none", sm: "block"}}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search locations..." />
          </Box>
          <IconButton
            display={{base: "block", sm: "none"}}
            aria-label="Search"
            as={MagnifyingGlass}
            variant="outline"
            borderRadius="full"
            borderColor={colorMode==="dark" ? "gray.700" : "gray.300"}
            borderWidth="2px"
            p={2}
            h="fit-content"
            size="md"
            _hover={{ bg: "gray.100" }}
            _active={{ bg: "gray.200" }}
            _dark={{
              _hover: { bg: "whiteAlpha.100" },
              _active: { bg: "whiteAlpha.200" },
            }}
          />
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          <Button onClick={handleNew} borderRadius="md" boxShadow="sm" bg="orange" color={text} size={{base: "xs", md:"sm"}}>
            <Plus/><Text display={{base: "none", md: "block"}}>Add New Location</Text>
          </Button>
        </Flex>
      </Flex>
      {hydrated? (
        <DataTable columns={columns} data={displayed} sortConfig={sortConfig} onSort={requestSort} page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} count={displayed.length} total={sorted.length} name="locations"
          renderRow={(l: Location) => (
            <>
              <Table.Cell textAlign="center" textDecor={"underline"}><Link href={`/locations/${l.loc_name}`} passHref>{l.loc_name}</Link></Table.Cell>
              <Table.Cell textAlign="center" textTransform="capitalize">{l.loc_number||"N/A"}</Table.Cell>
              <Table.Cell textAlign="center">{l.details?.project_name ?? l.project_id}</Table.Cell>
              <Table.Cell textAlign="center">{l.lat}</Table.Cell>
              <Table.Cell textAlign="center">{l.lon}</Table.Cell>
              <Table.Cell textAlign="center">{l.created_at?.split('T')[0]||"N/A"}</Table.Cell>
              <Table.Cell textAlign="center">{l.last_updated?.split('T')[0]||"N/A"}</Table.Cell>
              <Table.Cell textAlign="center">{l.last_inspected?.split('T')[0]||"N/A"}</Table.Cell>
              <Table.Cell textAlign="center">
                <Box display="inline-block" boxSize="10px" borderRadius="full" bg={l.active ? 'green.400' : 'red.400'} />
              </Table.Cell>
              <Table.Cell textAlign="center">
                <Box display={"inline-block"}>
                  <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
                    <Popover.Trigger asChild>
                      <IconButton aria-label="More actions" variant="ghost" size="xs" color="black" borderRadius="48px" width={"32px"}
                        onClick={(e) => e.stopPropagation()}
                        _hover={{
                          backgroundColor: 'blackAlpha.300',
                        }}
                        _dark={{
                          color: "white",
                          _hover: {backgroundColor: "whiteAlpha.200"}
                        }}
                      >
                        <DotsThreeVertical weight="bold"/>
                      </IconButton>
                    </Popover.Trigger>
                    <Popover.Positioner>
                      <Popover.Content width="64px" height="100px" borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                        <Popover.Arrow>
                          <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1} _dark={{borderColor: "whiteAlpha.600"}}/>
                        </Popover.Arrow>
                        <Popover.Body height="100px" p={0}>
                          <VStack gap={0} justifyContent={"center"} height="inherit">
                            <Button variant="ghost" size="md" onClick={() => handleEdit(l)}>
                              <PencilSimple />
                            </Button>
                            <Button variant="ghost" size="md" onClick={() => handleDelete(l)}>
                              <Trash />
                            </Button>
                          </VStack>
                        </Popover.Body>
                      </Popover.Content>
                    </Popover.Positioner>
                  </Popover.Root>
                </Box>
              </Table.Cell>
            </>
          )}
        />
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
