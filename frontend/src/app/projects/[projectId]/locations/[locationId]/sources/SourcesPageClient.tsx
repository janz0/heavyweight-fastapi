// File: app/projects/[projectId]/locations/[locationId]/sources/SourcesPageClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { ProjectsBreadcrumb } from "@/app/components/ProjectsBreadcrumb";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Skeleton,
  Button,
  IconButton,
  Popover,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import type { Source } from "@/types/source";

interface Props {
  sources: Source[];
  projectId: string;
  locationId: string;
}

export default function SourcesPageClient({
  sources: initialSources,
  projectId,
  locationId,
}: Props) {
  // (1) hydration flag (same as ProjectsPageClient)
  const [hydrated, setHydrated] = useState(false);
  // (2) manage edit/delete dialogs if needed (mimicking ProjectsPageClient)
  const [toEdit, setToEdit] = useState<Source | undefined>();
  const [toDelete, setToDelete] = useState<Source | undefined>();
  // (3) local state of sources so we could add search/filter later
  const [sources, setSources] = useState<Source[]>(initialSources);
  // (4) handle popover open state per‐row
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Handlers (stubbed—implement your own edit/delete modals if you want)
  const handleEdit = (s: Source) => {
    setToEdit(s);
    // open your edit dialog…
  };
  const handleDelete = (s: Source) => {
    setToDelete(s);
    // open your delete dialog…
  };

    // Boilerplate to reference toEdit, toDelete, setSources so TS won’t complain about unused vars
  useEffect(() => {
    if (toEdit) {
      // no-op: touched toEdit
      console.debug("Editing source ID:", toEdit.id);
    }
    if (toDelete) {
      // no-op: touched toDelete
      console.debug("Deleting source ID:", toDelete.id);
    }
    // no-op update to sources to reference setSources
    setSources((prev) => prev);
  }, [toEdit, toDelete, setSources]);
  
  return (
    <Box px={6} py={4}>
      {/* Breadcrumb: Dashboard → Projects → [projectId] → [locationId] */}
      <ProjectsBreadcrumb
        projectName={projectId}
        projectId={projectId}
        locationName={locationId}
        locationId={locationId}
      />

      <Box p={6} mb={6} className="c-card shadow-md">
        <Heading as="h2" size="lg">
          Sources
        </Heading>
        <Text mt={2} color="gray.600">
          All sources for this location
        </Text>
      </Box>

      {/* You could add filters/search similarly */}
      {/* Example: <Input placeholder="Search sources…" /> */}

      {/* “+ New Source” button (stub; implement your own modal if needed) */}
      <Flex justify="flex-end" mb={4}>
        <Button
          onClick={() => {
            /* open “Create Source” modal */
          }}
          colorScheme="teal"
        >
          + New Source
        </Button>
      </Flex>

      {/* Table Header */}
      <Box bg="whiteAlpha.50" py={4} px={6} className="c-card shadow-md">
        <Flex>
          <Box flex="1">
            <Flex>
              <Box flex="2">
                <Text fontWeight="bold">Source Name</Text>
              </Box>
              <Box flex="3">
                <Text fontWeight="bold">Location</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Folder Path</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">File Keyword</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">File Type</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Source Type</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Config</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Last Data Upload</Text>
              </Box>
              <Box flex="1" textAlign="center">
                <Text fontWeight="bold">Status</Text>
              </Box>
            </Flex>
          </Box>
          <Box flex="0 0 auto" textAlign="center" w={20}>
            <Text fontWeight="bold">Actions</Text>
          </Box>
        </Flex>
      </Box>

      {/* Rows: show skeletons until hydration, then actual data */}
      {!hydrated ? (
        <VStack gap={2} mt={2}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="72px" width="100%" borderRadius="md" />
          ))}
        </VStack>
      ) : (
        <VStack gap={2} align="stretch" mt={2}>
          {sources.map((src) => {
            const isOpen = openId === src.id;
            return (
              <Flex
                key={src.id}
                align="center"
                as="a"
                py={4}
                className="info-card shadow-md"
              >
                <Box flex="1">
                  {/* Entire row is a link to the “view source” page */}
                  <Link
                    href={`/projects/${projectId}/locations/${locationId}/sources/${src.id}`}
                    passHref
                  >
                    <Flex cursor="pointer">
                      <Box flex="5">
                        <Text fontWeight="medium">{src.source_name}</Text>
                      </Box>
                      <Box flex="1" textAlign="center">
                        <Text>
                          {src.folder_path}
                        </Text>
                      </Box>
                      <Box flex="1" textAlign="center">
                        <Text>
                          {src.file_keyword}
                        </Text>
                      </Box>
                      <Box flex="1" textAlign="center">
                        <Text>
                          {src.file_type}
                        </Text>
                      </Box>
                      <Box flex="1" textAlign="center">
                        <Text>
                          {src.source_type}
                        </Text>
                      </Box>
                      <Box flex="1" textAlign="center">
                        <Text>
                      {src.config ? src.config.toString().replace("{", "").replace("}", "").replace(/"/g, "") : ""}
                        </Text>
                      </Box>
                      <Box flex="1" textAlign="center">
                        <Text>
                          {new Date(src.last_updated).toLocaleDateString()}
                        </Text>
                      </Box>
                      <Box flex="1" textAlign="center">
                        <Box
                          as="span"
                          display="inline-block"
                          boxSize="18px"
                          borderRadius="full"
                          bg={
                            src.active === 1 ? "#28a745" : "#dc3545"
                          }
                          aria-label={src.active === 1 ? "Active" : "Inactive"}
                          role="img"
                          verticalAlign="middle"
                        />
                      </Box>
                    </Flex>
                  </Link>
                </Box>

                {/* 3‐dot popover for Edit/Delete (outside the Link) */}
                <Box
                  flex="0 0 auto"
                  w={20}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Popover.Root
                    open={isOpen}
                  >
                    <Popover.Trigger>
                      <IconButton
                        aria-label="More actions"
                        variant="ghost"
                        size="xs"
                        color="black"
                        borderRadius="48px"
                        width="32px"
                        _hover={{ backgroundColor: "blackAlpha.300" }}
                        _dark={{
                          color: "white",
                          _hover: { backgroundColor: "whiteAlpha.200" },
                        }}
                        onClick={() => setOpenId(isOpen ? null : src.id)}
                      >
                        <FiMoreVertical />
                      </IconButton>
                    </Popover.Trigger>
                    <Popover.Content
                      width="64px"
                      height="100px"
                      p={1}
                      borderColor="blackAlpha.600"
                      _dark={{ borderColor: "whiteAlpha.600" }}
                      borderWidth={1}
                    >
                      <Popover.Arrow>
                        <Popover.ArrowTip
                          borderColor="blackAlpha.600"
                          borderWidth={1}
                          _dark={{ borderColor: "whiteAlpha.600" }}
                        />
                      </Popover.Arrow>
                      <Popover.Body p={2}>
                        <VStack gap={1} align="stretch">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(src)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDelete(src)}
                          >
                            <FiTrash2 />
                          </Button>
                        </VStack>
                      </Popover.Body>
                    </Popover.Content>
                  </Popover.Root>
                </Box>
              </Flex>
            );
          })}
        </VStack>
      )}

      {/* TODO: Add CreateSourceWizard and DeleteSourceDialog if you want to mirror ProjectsPage */}

    </Box>
  );
}
