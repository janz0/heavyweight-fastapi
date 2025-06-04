"use client";

import { Box, Flex, VStack, Text, Spinner, IconButton, Popover, Button } from "@chakra-ui/react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import Link from "next/link";
import type { Location } from '@/types/location';

interface LocationsListProps {
  /** the locations to display */
  locations: Location[];
  /** the parent project’s id */
  projectId: string;
  /** whether we’re still waiting on data */
  loading?: boolean;
  /** any error from fetching */
  error?: string | null;
  /** callback when user clicks “edit” */
  onEdit?: (loc: Location) => void;
  /** callback when user clicks “delete” */
  onDelete?: (loc: Location) => void;
}

export function LocationsList({
  locations,
  projectId,
  loading = false,
  error = null,
  onEdit,
  onDelete,
}: LocationsListProps) {

  if (loading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }
  if (error) {
    return (
      <Box color="red.400" textAlign="center" py={4}>
        Error loading locations: {error}
      </Box>
    );
  }
  if (locations.length === 0) {
    return (
      <Box textAlign="center" py={6} color="gray.500">
        No locations to show.
      </Box>
    );
  }
  return (
    <VStack gap={2} align="stretch" mt={2}>
      {locations.map((loc) => {
        return (
          <Flex 
            key={loc.id} 
            align="center"
            as="a"
            cursor="pointer"
            py={4}
            className="info_card"
            >
            <Box flex="1">
              <Link href={`/projects/${projectId}/locations/${loc.id}`} passHref>
                <Flex justifyContent={"space-between"}>
                  <Box flex="5">
                    <Text fontWeight="medium">{loc.loc_name}</Text>
                  </Box>
                  <Box flex="1" textAlign="center">
                    <Text>{loc.lat}</Text>
                  </Box>
                  <Box flex="1" textAlign="center">
                    <Text>{loc.lon}</Text>
                  </Box>
                  <Box flex="1" textAlign="center">
                    <Text>{loc.frequency}</Text>
                  </Box>
                  <Box flex="1" textAlign="center" pr={4}>
                    <Box
                      as="span"
                      display="inline-block"
                      boxSize="18px"           // 8px × 8px square
                      borderRadius="full"     // makes it a circle
                      bg={loc.active === 1 ? "#28a745" : "#dc3545"}
                      aria-label={loc.active === 1 ? "Active" : "Inactive"}
                      role="img"
                      verticalAlign="middle"  // line up with text
                    />
                  </Box>
                </Flex>
              </Link>
            </Box>
            <Box flex="0 0 auto" w={20} display={"flex"} alignItems={"center"} justifyContent={"center"}>
              <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}} closeOnEscape={false}>
                <Popover.Trigger asChild>
                  <IconButton
                    textAlign={"right"}
                    verticalAlign={"center"}
                    aria-label="More actions"
                    variant="ghost"
                    size="xs"
                    color="white"
                    borderRadius="lg"
                    width={"32px"}
                    _hover={{
                      backgroundColor: 'whiteAlpha.200',
                    }}
                  >
                    <FiMoreVertical />
                  </IconButton>
                </Popover.Trigger>

                <Popover.Positioner>
                  <Popover.Content
                    width="64px"
                    height="100px"
                    p={1}
                    background={"gray.200"}
                  >
                    <Popover.Arrow>
                      <Popover.ArrowTip />
                    </Popover.Arrow>
                    <Popover.Body p={2}>
                      <VStack gap={1} align="stretch">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onEdit?.(loc);
                          }}
                        ><FiEdit2 />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          colorScheme="red"
                          onClick={() => {
                            onDelete?.(loc);
                          }}
                        ><FiTrash2 />
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
  );
}
