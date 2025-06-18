// File: app/components/ProjectsListClient.tsx
'use client';

import React from 'react';
import Link from 'next/link';

import { Box, Button, Flex, IconButton, Popover, Text, VStack } from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';

import type { Project } from '@/types/project';

interface Props {
  initialProjects: Project[];
  onEdit?:   (proj: Project) => void;
  onDelete?: (proj: Project) => void;
}

export default function ProjectsListClient({
  initialProjects,
  onEdit,
  onDelete,
}: Props) {
  return (
    <VStack gap={2} align="stretch" mt={2}>
      {initialProjects.map((proj) => {
        return (
        <Flex key={proj.id} align="center" as="a" py={4} className='info-card shadow-md'>
          <Box flex="1">
            {/* 1) Entire row data is one link */}
            <Link href={`/projects/${proj.id}`} passHref>
              <Flex>
                <Box flex="5">
                  <Text fontWeight="medium">{proj.project_name}</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text>{new Date(proj.start_date).toLocaleDateString()}</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text>
                    {proj.end_date
                      ? new Date(proj.end_date).toLocaleDateString()
                      : '-'}
                  </Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Text>{proj.locations_count}</Text>
                </Box>
                <Box flex="1" textAlign="center">
                  <Box
                    as="span"
                    display="inline-block"
                    boxSize="18px"
                    borderRadius="full"
                    bg={proj.status === 'Active' ? '#28a745' : '#dc3545'}
                    aria-label={proj.status}
                    role="img"
                    verticalAlign="middle"
                  />
                </Box>
              </Flex>
            </Link>
          </Box>
          {/* 2) Three-dots popover trigger sits OUTSIDE that link */}
          <Box flex="0 0 auto" w={20} display={"flex"} alignItems={"center"} justifyContent={"center"}>
            <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
              <Popover.Trigger asChild>
                <IconButton
                  aria-label="More actions"
                  variant="ghost"
                  size="xs"
                  color="black"
                  borderRadius="48px"
                  width={"32px"}
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
                      <Button variant="ghost" size="sm" onClick={() => onEdit?.(proj)}>
                        <FiEdit2 />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        colorScheme="red"
                        onClick={() => onDelete?.(proj)}
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
