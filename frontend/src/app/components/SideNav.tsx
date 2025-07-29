// File: Sidebar.tsx
"use client";

import { useState } from "react";
import { Box, VStack, Icon, Button } from "@chakra-ui/react";
import Link from "next/link";
import { House, CaretRight, Folder, MapPin, Gauge, Database } from "phosphor-react";
import { useColorModeValue } from "../src/components/ui/color-mode";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBoxHovered, setIsBoxHovered] = useState(false);
  const [isShrunk, setShrinkHome] = useState(false);
  const arrowColor = useColorModeValue("gray.200", "#212121");
  const textColor = useColorModeValue("gray.600", "white");
  const hoverBg = useColorModeValue("#dcdde0", "#2a2a2c");
  const hoverArrowColor = useColorModeValue("gray.400", "#212121");
  const hoverButton = useColorModeValue("gray.100", "black");
  const sidebarWidth = isOpen ? "221px" : isBoxHovered ? "36px" : "30px";  // expanded vs. collapsed
  const iconBgColor = isBoxHovered && !isOpen ? hoverArrowColor : arrowColor;
  const pathname = usePathname();
  const isHomeActive = pathname === "/", isProjectsActive = pathname === "/projects", isLocationsActive = pathname === "/locations", isSensorsActive = pathname === "/sensors", isSourcesActive = pathname === "/sources";
  return (
    <Box as="nav" overflow="visible" zIndex={0} borderTopLeftRadius={"lg"} bg="gray.200" position="relative" _hover={isOpen ? undefined : {backgroundColor: hoverBg}} w={sidebarWidth} transition="width 0.5s ease-in-out" onClick={() => {if (!isOpen) {setIsOpen(!isOpen);}}} cursor={isOpen ? "auto" : "pointer"} onMouseEnter={() => {setIsBoxHovered(true); setShrinkHome(true)}}
      onMouseLeave={() => {setIsBoxHovered(false); setShrinkHome(false)}}
        _after={{
          content: '""',
          pos: "absolute",
          top: 0,
          bottom: 0,
          right: "-8px",            // push into the 1-unit gap (e.g. 4px)
          width: "8px",             // fade over 8px (4px gap + 4px bleed)
          bg: "linear-gradient(90deg, var(--chakra-colors-gray-200), var(--chakra-colors-gray-300))",
          pointerEvents: "none",    // so it never blocks clicks
          zIndex: -1,
        }}>
      <Box position="fixed" w="inherit">
      <Icon as={CaretRight}
        size={"md"} backgroundColor={iconBgColor} cursor="pointer"
        position="absolute" top="3" right="-4"
        borderRadius={"full"}
        opacity={isOpen && !isBoxHovered ? 0 : 1}
        _hover={{backgroundColor: hoverArrowColor, display: "undefined"}}
        onClick={() => setIsOpen(!isOpen)}
        transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"} transformOrigin="center" transition="transform 0.3s ease-in-out"
      />
      <VStack overflow="hidden" display={isOpen ? "flex" : "none"} alignItems={"left"} p="2" gap="0" truncate transition="display 2s">
        <VStack alignItems={"inherit"}>
          <Link href="/" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isHomeActive ? "blackAlpha.700" : textColor} bg={isHomeActive ? "rgba(194, 213, 255, 0.40)" : "none" } _hover={{bg: isHomeActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={House} boxSize={4} />Home
            </Button>
          </Link>
          <Link href="/projects" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isProjectsActive ? "blackAlpha.700" : textColor} bg={isProjectsActive ? "rgba(194, 213, 255, 0.40)" : "none" } _hover={{bg: isProjectsActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={Folder} boxSize={4} />Projects
            </Button>
          </Link>
          <Link href="/locations" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isLocationsActive ? "blackAlpha.700" : textColor} bg={isLocationsActive ? "rgba(194, 213, 255, 0.40)" : "none" } _hover={{bg: isLocationsActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={MapPin} boxSize={4} />Locations
            </Button>
          </Link>
          <Link href="/sensors" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isSensorsActive ? "blackAlpha.700" : textColor} bg={isSensorsActive ? "rgba(194, 213, 255, 0.40)" : "none" } _hover={{bg: isSensorsActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={Gauge} boxSize={4} />Sensors
            </Button>
          </Link>
          <Link href="/sources" passHref>
            <Button z-index={1} justifyContent={"flex-start"} color={isSourcesActive ? "blackAlpha.700" : textColor} bg={isSourcesActive ? "rgba(194, 213, 255, 0.40)" : "none" } _hover={{bg: isSourcesActive ? "undefined" : hoverButton}} h="32px" w={isShrunk ? "90%" : "100%"} px="1" gap="8px">
              <Icon as={Database} boxSize={4} />Sources
            </Button>
          </Link>
        </VStack>
      </VStack>
      </Box>
    </Box>
  );
}
