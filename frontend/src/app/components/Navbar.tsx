// app/components/Navbar.tsx
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
import { useTheme as useNextTheme } from "next-themes";
import { Menu, X } from "lucide-react";
import LoginModal from "./LoginModal";
import { usePathname } from "next/navigation";
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
  const { resolvedTheme } = useNextTheme();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const bg = resolvedTheme === "light" ? "whiteAlpha.900" : "blackAlpha.900";

  return (
    <>
      <Box bg={bg} px={4} position="sticky" top={0} zIndex="1000" boxShadow="sm">
        <Flex h={16} align="center" justify="space-between">
          <IconButton
            size="md"
            aria-label="Toggle menu"
            display={{ md: "none" }}
            onClick={navOpen ? closeNav : openNav}
            variant="ghost"
          >
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </IconButton>

          <Box fontWeight="bold" fontSize="lg">
            RWH Monitoring
          </Box>

          <HStack gap={8} align="center" display={{ base: "none", md: "flex" }}>
            <Link as={NextLink} href="/">
              GO PRO
            </Link>
            {!user && (
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
            {user && (
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
            )}
          </HStack>
        </Flex>

        {navOpen && (
          <Box pb={4} display={{ md: "none" }}>
            <HStack as="nav" gap={4} flexDirection="column">
              <Link as={NextLink} href="/">
                GO PRO
              </Link>
              {!user && (
                <>
                  <Button
                    variant="ghost"
                    w="full"
                    onClick={() => {
                      closeNav();
                      openLogin();
                    }}
                  >
                    Log in
                  </Button>
                  <Link as={NextLink} href="/signup">
                    Sign up
                  </Link>
                </>
              )}
              {user && (
                <Button variant="ghost" w="full" onClick={logout}>
                  Log out
                </Button>
              )}
            </HStack>
          </Box>
        )}
      </Box>

      <LoginModal isOpen={loginOpen} onClose={closeLogin} />
    </>
  );
}
