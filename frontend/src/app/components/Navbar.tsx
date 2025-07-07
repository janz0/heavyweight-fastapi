// File: app/components/Navbar.tsx
"use client";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

import { ColorModeButton } from "@/app/src/components/ui/color-mode";
import LoginModal from "./LoginModal";
import { Menu, X } from "lucide-react";
import { Box, Button, Flex, HStack, IconButton, Link, useDisclosure } from "@chakra-ui/react";

import { useAuth } from "@/lib/auth";


export default function Navbar() {
  const {
    open: navOpen,
    onOpen: openNav,
    onClose: closeNav,
  } = useDisclosure();
  const {
    open: loginOpen,
    onOpen: openLogin,
    onClose: closeLogin,
  } = useDisclosure();
  const pathname = usePathname();

  // Replace `user` with `authToken`, and `logout` with `signOut`.
  const { authToken, signOut } = useAuth();

  return (
    <>
      <Box position="sticky" top={0} zIndex="1000" bg="inherit" className="shadow-md">
        <Flex align="center" justify="space-between" pl={"5%"} pr={"1%"}>
          <IconButton size="md" aria-label="Toggle menu" display={{ md: "none" }} onClick={navOpen ? closeNav : openNav} variant="ghost">
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </IconButton>
          <NextLink href={"/"}>
            <Box fontWeight="bold" fontSize="xl">
              RWH Monitoring
            </Box>
          </NextLink>
          <HStack gap={2} align="center" margin={1}  display={{ base: "none", md: "flex" }}>
            {!authToken && (
              <>
                <Button variant="ghost" onClick={() => pathname !== "/login" && openLogin()} >
                  Log in
                </Button>
                <Link as={NextLink} href="/signup">
                  Sign up
                </Link>
              </>
            )}

            {authToken && (
              <Button variant="ghost" className="navbar-button" onClick={() => signOut()}>
                Log out
              </Button>
            )}
          <ColorModeButton className="navbar-button"/>
          </HStack>
        </Flex>
      </Box>

      <LoginModal isOpen={loginOpen} onClose={closeLogin} />
    </>
  );
}
