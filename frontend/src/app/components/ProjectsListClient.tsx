// File: app/components/ProjectsListClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Flex,
  VStack,
  Text,
  IconButton,
  Popover,
  Button,
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiMoreVertical }       from 'react-icons/fi';
import type { Project }         from '@/types/project';

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
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <VStack gap={2} align="stretch" mt={2}>
      {initialProjects.map((proj) => {
        const isOpen = openId === proj.id;
        return (
        <Flex 
          key={proj.id} 
          align="center"
          as="a"
          cursor="pointer"
          px={6}
          py={4}
          borderRadius="md"
          bg="whiteAlpha.50"
          boxShadow="0 2px 4px rgba(0,255,255,0.7)"
          transition="all 0.2s"
          _hover={{
            boxShadow: '0 4px 8px rgba(250,250,250,0.8)',
            transform: 'translateY(-3px)',
          }}
          _active={{
            bg: 'gray.700',
            boxShadow: '0 4px 8px rgba(255,255,255,0.4)',
            transform: 'translateY(-1px)',
          }}
          >
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
            <Popover.Root open={isOpen} onOpenChange={(next) => setOpenId(next ? proj.id : null)} positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}} closeOnEscape={false}>
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
                        onClick={() => onEdit?.(proj)}
                      ><FiEdit2 />
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
