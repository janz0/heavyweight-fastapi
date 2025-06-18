// File: app/sources/SourcesPageClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "@chakra-ui/react";
import { CaretUp, CaretDown } from "phosphor-react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { CreateSourceWizard } from "@/app/components/CreateSourceWizard";
import { DeleteSourceDialog } from "@/app/components/DeleteSourceDialog";
import { useColorMode } from "../src/components/ui/color-mode";
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
  sources: Source[];
}

export default function SourcesPageClient({ sources: initialSources }: Props) {
  const { colorMode } = useColorMode();
  const [hydrated, setHydrated] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | undefined>();
  const [toDelete, setToDelete] = useState<Source | undefined>();
  const [isCEOpen, setCEOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);

  const sources = initialSources;
  const bg = colorMode === "light" ? "gray.100" : "gray.800";
  const cardBg = colorMode === "light" ? "gray.400" : "gray.700";
  const text = colorMode === "light" ? "gray.800" : "gray.200";
  const textSub = colorMode === "light" ? "gray.600" : "gray.400";

  useEffect(() => setHydrated(true), []);

  const sortedData = useMemo(() => {
    if (!sortConfig) return sources;
    const { key, direction } = sortConfig;
    return [...sources].sort((a, b) => {
      const aVal = getNestedValue(a, key);
      const bVal = getNestedValue(b, key);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === "asc" ? -1 : 1;
      if (bVal == null) return direction === "asc" ? 1 : -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [sources, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleNew = () => {
    setSelectedSource(undefined);
    setCEOpen(true);
  };

  const handleEdit = (src: Source) => {
    setSelectedSource(src);
    setCEOpen(true);
  };

  const handleDelete = (src: Source) => {
    setToDelete(src);
    setDelOpen(true);
  };

  return (
    <Box minH="100vh" bg={bg} p={6} color={text}>
      <Breadcrumb crumbs={[{ label: "Dashboard", href: "/" }]} />
      <Heading mb={4}>Monitoring Sources</Heading>

      <Box borderRadius="md" boxShadow="sm" overflowX="auto" p={4}>
        <Table.Root width="100%">
          <Table.Header>
            <Table.Row bg={cardBg}>
              {columns.map(({ key, label }) => (
                <Table.ColumnHeader
                  key={key}
                  onClick={() => requestSort(key)}
                  cursor="pointer"
                  whiteSpace="nowrap"
                  textAlign="center"
                  color={textSub}
                >
                  <Flex align="center" justify="center">
                    <Text fontWeight="bold" color={textSub}>{label}</Text>
                    {sortConfig?.key === key && (
                      <Icon as={sortConfig.direction === "asc" ? CaretUp : CaretDown} boxSize={4} color={textSub} ml={1} />
                    )}
                  </Flex>
                </Table.ColumnHeader>
              ))}
              <Table.ColumnHeader textAlign="center" color={textSub}>
                <Text fontWeight="bold" color={textSub}>Actions</Text>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {hydrated && sortedData.map((src) => (
              <Table.Row key={src.id} _hover={{ bg: colorMode === "light" ? "gray.50" : "gray.600" }}>
                {columns.map(({ key }) => (
                  <Table.Cell key={key} textAlign="center">
                    {key === "active" ? (
                      <Box
                        display="inline-block"
                        boxSize="10px"
                        borderRadius="full"
                        bg={getNestedValue(src, key) === 1 ? "green.400" : "red.400"}
                      />
                    ) : key === "last_updated" ? (
                      getNestedValue(src, key)
                        ? new Date(getNestedValue(src, key) as string)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    ) : (
                      String(getNestedValue(src, key) ?? "")
                    )}
                  </Table.Cell>
                ))}
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
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(src)}>
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleDelete(src)}
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
        <Button colorScheme="blue" onClick={handleNew}>
          + New Source
        </Button>
      </Flex>

      <CreateSourceWizard
        isOpen={isCEOpen}
        source={selectedSource}
        onClose={() => {
          setSelectedSource(undefined);
          setCEOpen(false);
        }}
      />

      <DeleteSourceDialog
        isOpen={isDelOpen}
        onClose={() => setDelOpen(false)}
        source={toDelete}
      />
    </Box>
  );
}
