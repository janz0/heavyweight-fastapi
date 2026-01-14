// File: Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { Box, VStack, Icon, Button, Text, Kbd } from "@chakra-ui/react";
import Link from "next/link";
import { House, CaretRight, Folder, MapPin, Gauge, Database } from "phosphor-react";
import { useColorModeValue } from "../../src/components/ui/color-mode";
import { Tooltip } from "@/app/src/components/ui/tooltip";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBoxHovered, setIsBoxHovered] = useState(false);
  const [isShrunk, setShrinkHome] = useState(false);
  const arrowColor = useColorModeValue("rgba(194, 213, 255, 0.8)", "gray.700");
  const textColor = useColorModeValue("gray.600", "white");
  //const hoverBg = useColorModeValue("#dcdde0", "gray.600");
  const hoverArrowColor = useColorModeValue("gray.300", "gray.500");
  const hoverButton = useColorModeValue("gray.100", "black");
  const isActiveColor = useColorModeValue("rgba(194, 213, 255, 0.40)", "blue.400")
  const sidebarWidth = isOpen ? "200px" : isBoxHovered ? "28px" : "24px";  // expanded vs. collapsed
  const iconBgColor = isBoxHovered && !isOpen ? hoverArrowColor : arrowColor;
  const pathname = usePathname();
  const sidebarBg = useColorModeValue(
    "linear-gradient(180deg, var(--chakra-colors-gray-200) 0%, rgba(194, 213, 255, 0.40) 100%)",
    "linear-gradient(180deg, var(--chakra-colors-gray-800) 0%, var(--chakra-colors-gray-700) 100%)",
  );

  const sidebarHoverBg = useColorModeValue(
    "linear-gradient(180deg, var(--chakra-colors-gray-200) 0%, #dcdde0 100%)",
    "linear-gradient(180deg, var(--chakra-colors-gray-700) 0%, var(--chakra-colors-gray-600) 100%)",
  );
  const isHomeActive = pathname === "/", isProjectsActive = pathname === "/projects", isLocationsActive = pathname === "/locations", isSensorsActive = pathname === "/sensors", isSourcesActive = pathname === "/sources";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Optional: don't trigger when typing in inputs/textareas/contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ctrl + . (also allow Cmd + . on Mac if you want)
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Box as="nav" display={{base: "none", md: "initial"}} zIndex={10} overflow="visible" borderTopLeftRadius={"lg"} bgImage={sidebarBg} position="sticky" _hover={isOpen ? undefined : { bgImage: sidebarHoverBg }} w={sidebarWidth} h="100%" transition="width 0.5s ease-in-out" onClick={() => {if (!isOpen) {setIsOpen(!isOpen);}}} cursor={isOpen ? "auto" : "pointer"} onMouseEnter={() => {setIsBoxHovered(true); setShrinkHome(true)}}
      onMouseLeave={() => {setIsBoxHovered(false); setShrinkHome(false)}}>
      <Tooltip
        content={
          <Text fontSize="xs" m={1}>
            {!isOpen ? "Open Navigation" : "Close Navigation"}: <Kbd variant="subtle" size="sm">ctrl</Kbd> + <Kbd variant="subtle" size="sm">.</Kbd>
          </Text>
        }
        showArrow
        openDelay={100}
        closeDelay={100}
        positioning={{ placement: "right" }}
      >
        <Icon
          as="button"
          bg={iconBgColor}
          cursor="pointer"
          position="absolute"
          top="3"
          right="-4"
          borderRadius="full"
          boxSize="24px"
          placeItems="center"
          opacity={isOpen && !isBoxHovered ? 0 : 1}
          _hover={{ bg: hoverArrowColor }}
          onClick={() => setIsOpen(!isOpen)}
          transition="transform 0.3s ease-in-out"
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
        >
          <CaretRight size={12} weight="bold" />
        </Icon>
      </Tooltip>
      <VStack overflow="hidden" display={isOpen ? "flex" : "none"} alignItems={"left"} p="2" gap="0" truncate transition="display 2s">
        <VStack alignItems={"inherit"}>
          <Link href="/" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isHomeActive ? "blackAlpha.700" : textColor} bg={isHomeActive ? isActiveColor : "none" } _hover={{bg: isHomeActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={House} boxSize={4} />Home
            </Button>
          </Link>
          <Link href="/projects" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isProjectsActive ? "blackAlpha.700" : textColor} bg={isProjectsActive ? isActiveColor : "none" } _hover={{bg: isProjectsActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={Folder} boxSize={4} />Projects
            </Button>
          </Link>
          <Link href="/locations" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isLocationsActive ? "blackAlpha.700" : textColor} bg={isLocationsActive ? isActiveColor : "none" } _hover={{bg: isLocationsActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={MapPin} boxSize={4} />Locations
            </Button>
          </Link>
          <Link href="/sensors" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isSensorsActive ? "blackAlpha.700" : textColor} bg={isSensorsActive ? isActiveColor : "none" } _hover={{bg: isSensorsActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={Gauge} boxSize={4} />Sensors
            </Button>
          </Link>
          <Link href="/sources" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isSourcesActive ? "blackAlpha.700" : textColor} bg={isSourcesActive ? isActiveColor : "none" } _hover={{bg: isSourcesActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={Database} boxSize={4} />Sources
            </Button>
          </Link>
        </VStack>
      </VStack>
    </Box>
  );
}
