// components/CountFooter/index.tsx
import { Flex, Text } from "@chakra-ui/react";
import React from "react";

export interface CountFooterProps {
  count: number;
  total: number;
  name: string;
  color?: string;
}

export default function CountFooter({ count, total, name, color = "gray.500" }: CountFooterProps) {
  return (
    <Flex display={{base:"none", sm: "initial"}} justify="flex-end" mb={4}>
      <Text fontSize="sm" color={color}>
        Showing {count} of {total} {name}
      </Text>
    </Flex>
  );
}