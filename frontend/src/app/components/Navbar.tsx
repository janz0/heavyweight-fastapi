// File: app/components/Navbar.tsx
"use client";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { ColorModeButton } from "@/app/src/components/ui/color-mode";
import { Menu } from "lucide-react";
import { Box, Button, CloseButton, Flex, Icon, HStack, IconButton, Link, Portal, useDisclosure, Drawer } from "@chakra-ui/react";
import { useColorModeValue } from "@/app/src/components/ui/color-mode";
import { useAuth } from "@/lib/auth";
import { User, Bell } from "phosphor-react";
import { Tooltip } from "../src/components/ui/tooltip";
import { GoHome } from 'react-icons/go';
import { BsPersonAdd } from 'react-icons/bs';
import { BackForward } from "./BackForward";

export default function Navbar() {
  const {
    open: navOpen,
    onOpen: openNav,
    onClose: closeNav,
  } = useDisclosure();
  const pathname = usePathname();

  // Replace `user` with `authToken`, and `logout` with `signOut`.
  const { authToken, signOut } = useAuth();

  const textColor = useColorModeValue("gray.800","#eeeeee");
  const navbgColor = useColorModeValue("gray.200","#212121");
  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: GoHome,
      active: pathname === "/",
    },
    {
      label: "Notifications",
      href: "#",
      icon: Bell,
    },
    {
      label: "Invite Members",
      href: "#",
      icon: BsPersonAdd,
    },
    {
      label: "Profile",
      href: "#",
      icon: User,
    },
  ];

  return (
    <>
      <Box position="sticky" top={0} zIndex="1000" bg={navbgColor} className="shadow-md">
        <Flex as="nav" align="center" justify="space-between" pr={"1%"}>
          <Box display="flex" alignItems="center" gap="0">
            <BackForward />
            <Box fontWeight="bold" display={{ base: "none", sm:"block"}} fontSize={["md", "xl"]} alignContent="center" color={textColor}>
              <NextLink href={"/"}>RWH Monitoring</NextLink>
            </Box>
          </Box>
          <Box
            display={{ base: "block", sm: "none" }}
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            fontWeight="bold"
            fontSize="md"
            color={textColor}
          >
            <NextLink href="/">RWH Monitoring</NextLink>
          </Box>
          <Flex justify="flex-end">
            <HStack gap={2} align="right" margin={1}  display={{ base: "none", md: "flex" }}>
              {authToken &&
              links.map((item) => (
                <Tooltip key={item.label} content={item.label} showArrow openDelay={100} closeDelay={0}>
                  <Link
                    as={NextLink}
                    key={item.label}
                    href={item.href}
                    _hover={{ textDecoration: "none", color: "orange.400" }}
                  >
                    <IconButton
                      aria-label={item.label}
                      variant="ghost"
                      color={item.active ? "orange.400" : undefined}
                    >{<Icon as={item.icon} />}</IconButton>
                  </Link>
                </Tooltip>
              ))}
            </HStack>
            {!authToken ? (
              <HStack gap={2}>
                <Button variant="ghost" onClick={openNav}>
                  Log in
                </Button>
                <Button as={NextLink} variant="ghost">
                  Sign up
                </Button>
                <ColorModeButton />
              </HStack>
            ) : (
              <HStack gap={2}>
                {/* logout button */}
                <Button variant="ghost" onClick={signOut} display={{ base: "none", md: "flex"}}>
                  Log out
                </Button>

                {/* drawer toggle on mobile */}
                <IconButton
                  aria-label="Menu"
                  variant="ghost"
                  display={{ md: "none" }}
                  onClick={navOpen ? closeNav : openNav}
                ><Menu size={24} /></IconButton>
              </HStack>
            )}
              <Flex alignItems="center"><ColorModeButton /></Flex>
            </Flex>
        </Flex>
      </Box>
      {/* ——————————————————————— MOBILE DRAWER ——————————————————————— */}
      <Drawer.Root open={navOpen} onOpenChange={() => openNav}>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header textAlign={"center"}>
                <Drawer.Title>RWH Monitoring</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                {links.map((item) => (
                  <Link
                    as={NextLink}
                    w="full"
                    key={item.label}
                    href={item.href}
                    _hover={{ textDecoration: "none" }}
                  >
                    <IconButton
                      aria-label={item.label}
                      variant="ghost"
                      color={item.active ? "orange.400" : undefined}
                      w="full"
                      justifyContent="left"
                      _hover={{ textDecoration: "none", color: "black", backgroundColor: "orange.400" }}
                    ><Icon as={item.icon} />{item.label}</IconButton>
                  </Link>
                ))}

                <Button
                  variant="ghost"
                  w="full"
                  onClick={() => {
                    signOut();
                    closeNav();
                  }}
                >
                  Log out
                </Button>
              </Drawer.Body>
              <Drawer.CloseTrigger asChild><CloseButton size="sm" onClick={closeNav} /></Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}
