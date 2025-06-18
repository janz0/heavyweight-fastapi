"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Flex,
  Heading,
  Text,
  Icon,
  Table,
  Button,
  IconButton,
  Popover,
  VStack,
  Input,
} from "@chakra-ui/react";
import { CaretUp, CaretDown } from "phosphor-react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";

import { ProjectsBreadcrumb } from "@/app/components/ProjectsBreadcrumb";
import { CreateProjectWizard } from "@/app/components/CreateProjectWizard";
import { DeleteProjectDialog } from "@/app/components/DeleteProjectDialog";
import { toaster } from "@/components/ui/toaster";
import type { Project } from "@/types/project";
import { useColorMode } from "../src/components/ui/color-mode";

interface Column {
  key: string;
  label: string;
}

const columns: Column[] = [
  { key: "project_name", label: "Project" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "locations_count", label: "Locations" },
  { key: "active", label: "Status" },
];

// Helper for nested keys (if ever needed)
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
  const [hydrated, setHydrated] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [toDelete, setToDelete] = useState<Project | undefined>();
  const [isCEOpen, setCEOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [search, setSearch] = useState("");

  const projects = initialProjects;
  const bg = colorMode === "light" ? "gray.100" : "gray.800";
  const cardBg = colorMode === "light" ? "gray.400" : "gray.700";
  const text = colorMode === "light" ? "gray.800" : "gray.200";
  const textSub = colorMode === "light" ? "gray.600" : "gray.400";

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

  const filteredProjects = useMemo(() => {
    if (!search) return projects;
    return projects.filter((p) =>
      p.project_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredProjects;
    const { key, direction } = sortConfig;
    return [...filteredProjects].sort((a, b) => {
      const aVal = getNestedValue(a, key);
      const bVal = getNestedValue(b, key);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === "asc" ? -1 : 1;
      if (bVal == null) return direction === "asc" ? 1 : -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [filteredProjects, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleNew = () => {
    setSelectedProject(undefined);
    setCEOpen(true);
  };

  const handleEdit = (p: Project) => {
    setSelectedProject(p);
    setCEOpen(true);
  };

  const handleDelete = (p: Project) => {
    setToDelete(p);
    setDelOpen(true);
  };

  return (
    <Box minH="100vh" bg={bg} p={6} color={text}>
      <ProjectsBreadcrumb />

      <Flex mb={4} justify="space-between" align="center">
        <Heading>Projects</Heading>
      </Flex>

      <Box mb={4}>
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="300px"
        />
      </Box>

      <Box borderRadius="md" boxShadow="sm" overflowX="auto" p={4}>
        <Table.Root width="100%">
          <Table.Header>
            <Table.Row bg={cardBg}>
              {columns.map(({ key, label }) => (
                <Table.ColumnHeader
                  key={key}
                  onClick={() => requestSort(key)}
                  cursor="pointer"
                  textAlign="center"
                  color={textSub}
                  whiteSpace="nowrap"
                >
                  <Flex align="center" justify="center">
                    <Text fontWeight="bold" color={textSub}>
                      {label}
                    </Text>
                    {sortConfig?.key === key && (
                      <Icon
                        as={sortConfig.direction === "asc" ? CaretUp : CaretDown}
                        boxSize={4}
                        color={textSub}
                        ml={1}
                      />
                    )}
                  </Flex>
                </Table.ColumnHeader>
              ))}
              <Table.ColumnHeader textAlign="center" color={textSub}>
                <Text fontWeight="bold" color={textSub}>
                  Actions
                </Text>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {hydrated &&
              sortedData.map((p) => (
                <Table.Row
                  key={p.id}
                  _hover={{
                    bg: colorMode === "light" ? "gray.50" : "gray.600",
                  }}
                >
                  <Link href={`/projects/${p.id.toLowerCase()}`} passHref style={{display: "contents"}}>
                  <Table.Cell textAlign="center" alignContent={"center"}>{p.project_name}</Table.Cell>
                  <Table.Cell textAlign="center" alignContent={"center"}>
                    {p.start_date
                      ? new Date(p.start_date).toISOString().split("T")[0]
                      : ""}
                  </Table.Cell>
                  <Table.Cell textAlign="center" alignContent={"center"}>
                    {p.end_date
                      ? new Date(p.end_date).toISOString().split("T")[0]
                      : ""}
                  </Table.Cell>
                  <Table.Cell textAlign="center" alignContent={"center"}>
                    {p.locations_count ?? 0}
                  </Table.Cell>
                  <Table.Cell textAlign="center" alignContent={"center"}>
                    <Box
                      display="inline-block"
                      boxSize="10px"
                      borderRadius="full"
                      bg={p.active === 1 ? "green.400" : "red.400"}
                    />
                  </Table.Cell>
                  </Link>
                  <Table.Cell textAlign="center" alignContent={"center"}>
                    <Box display={"inline-block"}>
                      <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
                        <Popover.Trigger asChild>
                          <IconButton
                            aria-label="More actions"
                            variant="ghost"
                            size="xs"
                            color="black"
                            borderRadius="48px"
                            width={"32px"}
                            onClick={(e) => e.stopPropagation()}
                            _hover={{
                              backgroundColor: 'blackAlpha.300',
                            }}
                            _dark={{
                              color: "white",
                              _hover: {backgroundColor: "whiteAlpha.200"}
                            }}
                          >
                            <FiMoreVertical />
                          </IconButton>
                        </Popover.Trigger>
          
                        <Popover.Positioner>
                          <Popover.Content width="64px" height="100px" p={1} borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                            <Popover.Arrow>
                              <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1}  _dark={{borderColor: "whiteAlpha.600"}}/>
                            </Popover.Arrow>
                            <Popover.Body p={2}>
                              <VStack gap={1} align="stretch">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                                  <FiEdit2 />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDelete(p)}
                                ><FiTrash2 />
                                </Button>
                              </VStack>
                            </Popover.Body>
                          </Popover.Content>
                        </Popover.Positioner>
                      </Popover.Root>
                    </Box>
                  </Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table.Root>
      </Box>
      <Flex justify="flex-end" mr={12}>
        <Button onClick={handleNew}>
          + New Project
        </Button>
      </Flex>
      <CreateProjectWizard
        isOpen={isCEOpen}
        project={selectedProject}
        onClose={() => {
          setSelectedProject(undefined);
          setCEOpen(false);
        }}
      />

      <DeleteProjectDialog
        isOpen={isDelOpen}
        onClose={() => {
          setToDelete(undefined);
          setDelOpen(false);
        }}
        project={toDelete}
      />
    </Box>
  );
}
