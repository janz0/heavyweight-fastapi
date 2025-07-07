// File: app/sources/components/SourcesPageClient.tsx
"use client";

// React + Next Imports
import { useState, useEffect, useMemo } from "react";

// Chakra Imports + Icons
import { Box, Button, Flex, Heading, IconButton, Link, Popover, Spinner, Table, VStack } from "@chakra-ui/react";
import { PencilSimple, Trash, DotsThreeVertical } from "phosphor-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import { Breadcrumb } from "@/app/components/Breadcrumb";
import SearchInput from "@/app/components/SearchInput";
import PageSizeSelect from "@/app/components/PageSizeSelect";
import DataTable from "@/app/components/DataTable";

// Services + Types
import { SourceCreateModal, SourceEditModal, SourceDeleteModal } from "./SourceModals";
import type { Source } from "@/types/source";

interface Column {
  key: string; // Allow nested key paths
  label: string;
}

const columns: Column[] = [
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

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

interface Props {
  sources: Source[];
}

export default function SourcesPageClient({ sources: initialSources }: Props) {
  const { colorMode } = useColorMode();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | undefined>();
  const [toDelete, setToDelete] = useState<Source | undefined>();

  const sources = initialSources;
  const pageSizeOptions = [10, 25, 50, 100];

  // Colors
  const bg = colorMode === "light" ? "gray.100" : "gray.800";
  const text = colorMode === "light" ? "gray.800" : "gray.200";

  const filtered = useMemo(() => sources.filter(s => s.source_name.toLowerCase().includes(search.toLowerCase())), [search, sources]);
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
  const handleNew = () => { setSelectedSource(undefined); setCreateOpen(true); };
  const handleEdit = (s: Source) => { setSelectedSource(s); setEditOpen(true); };
  const handleDelete = (s: Source) => { setToDelete(s); setDelOpen(true); };

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
        description: "Sources loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  return (
    <Box minH="100vh" bg={bg} p={6} color={text}>
      <Breadcrumb crumbs={[ {label: "Dashboard", href: "/" }, {label: "Sources", href: "/sources"}]} />
      {/* Header Row */}
      <Flex mb={4} align="center" position="relative" w="100%">
        <Heading fontSize="3xl">Monitoring Sources</Heading>
        <Box position="absolute" left="50%" transform="translateX(-50%)" width={{ base: "100%", sm: "400px" }} px={4}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search sources..." />
        </Box>
        <Flex ml="auto" align="center" gap={4}>
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          <Button onClick={handleNew} borderRadius="md" boxShadow="sm" bg={"orange"} color={text}>
            + Add New Source
          </Button>
        </Flex>
      </Flex>
      {hydrated? (
        <Box maxH="60vh" overflowY="auto">
          <DataTable columns={columns} data={displayed} sortConfig={sortConfig} onSort={requestSort} page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} count={displayed.length} total={sorted.length} name="sources"
            renderRow={(s: Source) => (
              <>
                <Table.Cell textAlign="center" textDecor={"underline"}><Link href={`/sources/${s.source_name}`}>{s.source_name}</Link></Table.Cell>
                <Table.Cell textAlign="center">{s.details?.loc_name}</Table.Cell>
                <Table.Cell textAlign="center">{s.folder_path}</Table.Cell>
                <Table.Cell textAlign="center">{s.file_keyword}</Table.Cell>
                <Table.Cell textAlign="center">{s.file_type}</Table.Cell>
                <Table.Cell textAlign="center">{s.source_type}</Table.Cell>
                <Table.Cell textAlign="center">{s.config}</Table.Cell>
                <Table.Cell textAlign="center">{s.last_updated?.split("T")[0]||"-"}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Box boxSize="10px" borderRadius="full" bg={s.active? "green.400":"red.400"} display="inline-block" />
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
                              <Button variant="ghost" size="md" onClick={() => handleEdit(s)}>
                                <PencilSimple />
                              </Button>
                              <Button variant="ghost" size="md" onClick={() => handleDelete(s)}>
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
        </Box>
      ) : (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      )}
      <SourceCreateModal isOpen={isCreateOpen} onClose={() => { setSelectedSource(undefined); setCreateOpen(false); } } />
      <SourceEditModal isOpen={isEditOpen} source={selectedSource} onClose={() => { setSelectedSource(undefined); setEditOpen(false); }} />
      <SourceDeleteModal isOpen={isDelOpen} source={toDelete} onClose={() => { setToDelete(undefined); setDelOpen(false); }} />
    </Box>
  );
}
