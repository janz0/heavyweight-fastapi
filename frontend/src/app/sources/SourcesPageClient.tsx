// File: app/sources/SourcesPageClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { CreateSourceWizard } from "@/app/components/CreateSourceWizard";

import { Box, Flex, Heading, Text, VStack, Skeleton, Button, IconButton, Popover } from "@chakra-ui/react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import type { Source } from "@/types/source";
import { DeleteSourceDialog } from "../components/DeleteSourceDialog";

interface Props {
  sources: Source[];
}

export default function SourcesPageClient({
  sources: initialSources,
}: Props) {
  // (1) hydration flag
  const [hydrated, setHydrated] = useState(false);

  // (2) manage edit/delete dialogs
  const [selectedSource, setSelectedSource] = useState<Source|undefined>(undefined);
  const { open: isCEOpen, onOpen: openCE, onClose: closeCE } = useDisclosure();
  const [toDelete, setToDelete] = useState<Source | undefined>();
  const { open: isDelOpen, onOpen: openDel, onClose: closeDel } = useDisclosure();
  
  // (3) local state of sources so we could add search/filter later
  const [sources, setSources] = useState<Source[]>(initialSources);

  // (4) handle popover open state per‐row
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Handlers
  const handleNew = () => {
    setSelectedSource(undefined);
    openCE();
  };
  const handleEdit = (src: Source) => {
    setSelectedSource(src);
    openCE();
  };
  const handleDelete = (s: Source) => {
    setToDelete(s);
    openDel();
  };
  
  useEffect(() => {
    if (toDelete) {
      console.debug("Deleting source ID:", toDelete.id);
    }
    setSources((prev) => prev);
  }, [toDelete, setSources]);
  
  return (
    <Box px={6}>
      <Breadcrumb crumbs={[{label: "Dashboard", href: "/"}]} />
      <Box p={3} mb={2} className="c-card shadow-md">
        <Heading as="h2" size="lg">
          Sources
        </Heading>
      </Box>
      <Flex justify="flex-end" mr="12">
        <Button
          m="2"
          mt="0"
          background="white"
          color="black"
          className="c-card shadow-md"
          _dark={{background: "black", color: "white"}}
          onClick={handleNew}
        >
          + New Source
        </Button>
      </Flex>

      {/* Table Header */}
      <Box bg="whiteAlpha.50" py={4} px={6} className="c-card shadow-md">
        <Flex>
          <Box flex="1">
            <Flex>
              <Box flex="1">
                <Text fontWeight="bold">Source Name</Text>
              </Box>
              <Box flex="2">
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
                py={2}
                className="info-card shadow-md"
              >
                <Box flex="1">
                  {/* Entire row is a link to the “view source” page */}
                  <Flex cursor="pointer" fontSize={"sm"}>
                    <Box flex="1">
                      <Text fontWeight="medium">{src.source_name}</Text>
                    </Box>
                    <Box flex="2">
                      <Text fontWeight="medium">{src.details?.loc_name ?? "(no location)"}</Text>
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
                </Box>
                <Box flex="0 0 auto" w={20} display="flex" alignItems="center" justifyContent="center">
                  <Popover.Root open={isOpen} positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
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
                    <Popover.Positioner>
                      <Popover.Content width="64px" height="100px" p={1} borderColor="blackAlpha.600" _dark={{ borderColor: "whiteAlpha.600" }} borderWidth={1}>
                        <Popover.Arrow>
                          <Popover.ArrowTip
                            borderColor="blackAlpha.600" borderWidth={1} _dark={{ borderColor: "whiteAlpha.600" }} />
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
                            >
                              <FiTrash2 />
                            </Button>
                          </VStack>
                        </Popover.Body>
                      </Popover.Content>
                    </Popover.Positioner>
                  </Popover.Root>
                </Box>
              </Flex>
            );
          })}
        </VStack>
      )}
      <CreateSourceWizard
        isOpen={isCEOpen}
        source={selectedSource}
        onClose={() => {
          setSelectedSource(undefined);
          closeCE();
        }}
      />
      <DeleteSourceDialog
        isOpen={isDelOpen}
        onClose={closeDel}
        source={toDelete}
      />
    </Box>
  );
}

