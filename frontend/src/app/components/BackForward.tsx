// File: app/components/BackForward.tsx
"use client";

import { Flex, IconButton } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigation } from "../context/NavigationContext";

export function BackForward() {
  const { canGoBack, canGoForward, back, forward } = useNavigation();
  return (
    <Flex gap={0} p={0} m={0} flex="1">
      <IconButton
        aria-label="Back"
        onClick={back}
        disabled={!canGoBack}
        variant="ghost"
        justifyContent={"flex-end"}
        p={0}
        m={0}
      ><ChevronLeft /></IconButton>
      <IconButton
        aria-label="Forward"
        onClick={forward}
        disabled={!canGoForward}
        variant="ghost"
        justifyContent={"flex-start"}
        p={0}
        m={0}
      ><ChevronRight /></IconButton>
    </Flex>
  );
}
