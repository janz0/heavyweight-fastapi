// File: app/components/Navbar.tsx
"use client";

import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { Menu, X } from "lucide-react";
import LoginModal from "./LoginModal";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ColorModeButton } from "@/app/src/components/ui/color-mode";

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
      <Box
        position="sticky"
        top={0}
        zIndex="1000"
        boxShadow="sm"
      >
        <Flex h={16} align="center" justify="space-between" pl={"5%"} pr={"2%"}>
          <IconButton
            size="md"
            aria-label="Toggle menu"
            display={{ md: "none" }}
            onClick={navOpen ? closeNav : openNav}
            variant="ghost"
          >
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </IconButton>

          <Box fontWeight="bold" fontSize="xl">
            RWH Monitoring
          </Box>
          <HStack gap={8} align="center" display={{ base: "none", md: "flex" }}>
            {!authToken && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => pathname !== "/login" && openLogin()}
                >
                  Log in
                </Button>
                <Link as={NextLink} href="/signup">
                  Sign up
                </Link>
              </>
            )}

            {authToken && (
              <Button variant="ghost" onClick={() => signOut()}>
                Log out
              </Button>
            )}
          <ColorModeButton />
          </HStack>
        </Flex>
      </Box>

      <LoginModal isOpen={loginOpen} onClose={closeLogin} />
    </>
  );
}
