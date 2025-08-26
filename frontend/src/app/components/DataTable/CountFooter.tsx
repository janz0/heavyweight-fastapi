// File: app/components/DataTable/CountFooter.tsx

// Chakra Imports
import { Flex, Text } from "@chakra-ui/react";

// Props
export interface CountFooterProps {
  count: number;
  total: number;
  name: string;
  color?: string;
}

/*
  This function returns a count footer for the table. Showing {x} of {total}
*/
export default function CountFooter({ count, total, name, color = "gray.500" }: CountFooterProps) {
  return (
    <Flex display={{base:"none", sm: "initial"}} justify="flex-end" mb={4}>
      <Text fontSize="sm" color={color}>
        Showing {count} of {total} {name}
      </Text>
    </Flex>
  );
}