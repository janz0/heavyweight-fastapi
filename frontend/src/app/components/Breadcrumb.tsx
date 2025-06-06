// app/components/Breadcrumb.tsx

import Link from 'next/link';
import { Box, Flex } from '@chakra-ui/react';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  crumbs: BreadcrumbItem[];
}

export function Breadcrumb({ crumbs }: BreadcrumbProps) {
  return (
    <Flex as="nav" aria-label="breadcrumb" justify="center" py={4}>
      <Flex as="ul" listStyleType="none">
        {crumbs.map((crumb, idx) => (
          <Link href={crumb.href} passHref key={idx}>
            <Box
              as="a"
              fontSize={{ base: 'xs', md: 'sm' }}
              px={{ base: 3, md: 6 }}
              py={2}
              mx={1}
              transform="skew(-21deg)"
              color={"black"}
              _hover={{color: "white"}}
              _dark={{color: "white"}}
              className='breadcrumb'
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