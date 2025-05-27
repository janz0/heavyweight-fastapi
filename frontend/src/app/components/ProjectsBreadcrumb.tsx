// File: app/components/ProjectsBreadcrumb.tsx
'use client';

import Link from 'next/link';
import { Box, Flex } from '@chakra-ui/react';

const baseCrumbs = [
  { label: 'Dashboard', href: '/' },
  { label: 'Projects', href: '/projects' },
];

interface ProjectsBreadcrumbProps {
  projectName?: string;
  projectId?: string;
  locationName?: string;
  locationId?: string;
}

export function ProjectsBreadcrumb({
  projectName,
  projectId,
  locationName,
  locationId,
}: ProjectsBreadcrumbProps) {
  const crumbs = [...baseCrumbs];

  if (projectName && projectId) {
    crumbs.push({
      label: projectName,
      href: `/projects/${projectId}`,
    });
  }

  if (locationName && locationId) {
    crumbs.push({
      label: locationName,
      href: `/projects/${projectId}/locations/${locationId}`,
    });
  }

  return (
    <Flex as="nav" aria-label="breadcrumb" justify="center" py={4}>
      <Flex as="ul" listStyleType="none">
        {crumbs.map((crumb, idx) => (
          <Link href={crumb.href} passHref key={idx}>
            <Box
              as="a"
              display="inline-block"    /* ensure each pill is its own block */
              overflow="hidden"         /* clip any child overflow */
              transform="skew(-21deg)"
              bg="white"
              color="gray.800"
              textTransform="uppercase"
              fontSize={{ base: 'xs', md: 'sm' }}
              letterSpacing="1px"
              boxShadow="0 2px 5px rgba(0,0,0,0.26)"
              borderRadius="7px"
              px={{ base: 3, md: 6 }}
              py={2}
              mx={1}
              cursor="pointer"
              transition="all 0.3s ease"
              _hover={{
                bg: '#490099',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transform: 'skew(-21deg) translateY(-2px)',
              }}
            >
              <Box transform="skew(21deg)" textAlign="center">
                {crumb.label}
              </Box>
            </Box>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}
