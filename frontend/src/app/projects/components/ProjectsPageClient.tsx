// File: app/projects/components/ProjectsPageClient.tsx
"use client";

// React + Next Imports
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Chakra Imports + Icons
import { Box, Button, Flex, Heading, IconButton, Table, Text, Popover, VStack, Spinner } from "@chakra-ui/react";
import { PencilSimple, Trash, DotsThreeVertical, Plus, MagnifyingGlass } from "phosphor-react";
import { toaster } from "@/components/ui/toaster";
import { useColorMode } from "@/app/src/components/ui/color-mode";

// UI Components
import SearchInput from "@/app/components/SearchInput";
import PageSizeSelect from "@/app/components/PageSizeSelect";
import DataTable from "@/app/components/DataTable";
//import CountFooter from "@/app/components/CountFooter";

// Services + Types
import { ProjectCreateModal, ProjectDeleteModal, ProjectEditModal } from "./ProjectModals";
import type { Project } from "@/types/project";

interface Column {
  key: string;
  label: string;
}

const columns: Column[] = [
  { key: "project_name", label: "Project" },
  { key: "project_number", label: "Number" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "locations_count", label: "Locations" },
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
  projects: Project[];
}

export default function ProjectsPageClient({ projects: initialProjects }: Props) {
  const { colorMode } = useColorMode();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc"|"desc" }|null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [toDelete, setToDelete] = useState<Project | undefined>();

  const projects = initialProjects;
  const pageSizeOptions = [10, 25, 50, 100];

  // Colors
  const bg = colorMode === "light" ? "gray.100" : "gray.800";
  const text = colorMode === "light" ? "gray.800" : "gray.200";

  const filtered = useMemo(() => projects.filter(p => p.project_name.toLowerCase().includes(search.toLowerCase())), [search, projects]);
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
  const handleNew = () => { setSelectedProject(undefined); setCreateOpen(true); };
  const handleEdit = (p: Project) => { setSelectedProject(p); setEditOpen(true); };
  const handleDelete = (p: Project) => { setToDelete(p); setDelOpen(true); };

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
        description: "Projects loaded",
        type: "success",
        duration: 3000,
      });
    });
  }, []);

  return (
    <Box minH="100vh" bg={bg} p={6} color={text}>
      {/* Header Row */}
      <Flex mb={4} align="center" position="relative" w="100%">
        <Heading fontSize="3xl">Projects</Heading>
        <Flex ml="auto" align="center" gap={4}>
          <Box minW="20ch" display={{base: "none", sm: "block"}}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
          </Box>
          <IconButton
            display={{base: "block", sm: "none"}}
            aria-label="Search"
            as={MagnifyingGlass}
            variant="outline"
            borderRadius="full"
            borderWidth="2px"
            p={2}
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
            <Plus/><Text display={{base: "none", md: "block"}}>Add New Project</Text>
          </Button>
        </Flex>
      </Flex>
      {hydrated? (
        <DataTable columns={columns} data={displayed} sortConfig={sortConfig} onSort={requestSort} page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} count={displayed.length} total={sorted.length} name="projects"
          renderRow={(p: Project) => (
            <>
              <Table.Cell textAlign="center" textDecor={"underline"}><Link href={`/projects/${p.project_number}`} passHref>{p.project_name}</Link></Table.Cell>
              <Table.Cell textAlign="center">{p.project_number}</Table.Cell>
              <Table.Cell textAlign="center">
                {p.start_date?.split("T")[0]||""}
              </Table.Cell>
              <Table.Cell textAlign="center">
                {p.end_date?.split("T")[0]||""}
              </Table.Cell>
              <Table.Cell textAlign="center">{p.locations_count||0}</Table.Cell>
              <Table.Cell textAlign="center">
                <Box boxSize="10px" borderRadius="full" bg={p.active? "green.400":"red.400"} display="inline-block" />
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
                            <Button variant="ghost" size="md" onClick={() => handleEdit(p)}>
                              <PencilSimple />
                            </Button>
                            <Button variant="ghost" size="md" onClick={() => handleDelete(p)}>
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
      <ProjectCreateModal isOpen={isCreateOpen} onClose={() => { setSelectedProject(undefined); setCreateOpen(false);}} />
      <ProjectEditModal isOpen={isEditOpen} project={selectedProject} onClose={() => { setSelectedProject(undefined); setEditOpen(false); }} />
      <ProjectDeleteModal isOpen={isDelOpen} onClose={() => { setToDelete(undefined); setDelOpen(false); }} project={toDelete} />
    </Box>
  );
}
