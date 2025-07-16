// File: app/components/Navbar.tsx
"use client";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

import { ColorModeButton } from "@/app/src/components/ui/color-mode";
import { Menu, X } from "lucide-react";
import { Box, Button, Flex, HStack, IconButton, Link, useDisclosure } from "@chakra-ui/react";
import { useColorModeValue } from "@/app/src/components/ui/color-mode";
import { useAuth } from "@/lib/auth";
import { Gauge } from "phosphor-react";


export default function Navbar() {
  const {
    open: navOpen,
    onOpen: openNav,
    onClose: closeNav,
  } = useDisclosure();
  const {
    onOpen: openLogin,
  } = useDisclosure();
  const pathname = usePathname();

  // Replace `user` with `authToken`, and `logout` with `signOut`.
  const { authToken, signOut } = useAuth();

  const textColor = useColorModeValue("gray.800","gray.fg");
  const navbgColor = useColorModeValue("gray.200","gray.700");
  const dashboardPath = "/";

  return (
    <>
      <Box position="sticky" top={0} zIndex="1000" bg={navbgColor} className="shadow-md">
        <Flex align="center" position="relative" pl={"1%"} pr={"1%"}>
          <Box flex="1">
          <IconButton size="md" aria-label="Toggle menu" display={{ md: "none" }} onClick={navOpen ? closeNav : openNav} variant="ghost">
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </IconButton>
          <NextLink href={"/"}>
            <Box fontWeight="bold" fontSize="xl" color={textColor}>
              RWH Monitoring
            </Box>
          </NextLink>
          </Box>
          
            {authToken && (
              <Flex
                flex="1"
                justify="center"
              >
                <Link
                  as={NextLink}
                  href={dashboardPath}
                  fontWeight={pathname === dashboardPath ? "bold" : "normal"}
                  color={pathname === dashboardPath ? "orange" : undefined}
                  _hover={{ textDecoration: "none", color: "orange.400" }}
                >
                  <Gauge size={"24px"} weight="bold" style={{ marginRight: 4 }} />
                  Dashboard
                </Link>
              </Flex>
            )}
          <Flex flex="1" justify="flex-end">
            <HStack gap={2} align="right" margin={1}  display={{ base: "none", md: "flex" }}>
              {!authToken ? (
                <>
                  <Button variant="ghost" onClick={() => pathname !== "/login" && openLogin()} >
                    Log in
                  </Button>
                  <Link as={NextLink} href="/signup">
                    Sign up
                  </Link>
                </>
              ) : ( 
                <Button variant="ghost" className="navbar-button" onClick={() => signOut()}>
                  Log out
                </Button>
              )}
              <ColorModeButton className="navbar-button"/>
            </HStack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
