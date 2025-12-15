// File: app/components/Navbar.tsx
"use client";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import { ColorModeIcon } from "@/app/src/components/ui/color-mode";
import { Menu, Plus } from "lucide-react";
import { Box, Button, CloseButton, Dialog, Flex, Field, Icon, HStack, IconButton, Link, Text, Portal, useDisclosure, Drawer, Separator, VStack, Input, Group } from "@chakra-ui/react";
// import { Circle } from "@chakra-ui/react";
import { useColorModeValue, useColorMode } from "@/app/src/components/ui/color-mode";
import { useAuth } from "@/lib/auth";
import { User, Bell } from "phosphor-react";
import { Tooltip } from "../../src/components/ui/tooltip";
import { GoHome } from 'react-icons/go';
import { BsPeopleFill, BsPersonAdd, BsQuestionLg } from 'react-icons/bs';
import { BackForward } from "./BackForward";
import { useState, useRef, useEffect } from "react";
import { FiLogOut } from "react-icons/fi";
import { TeamsModal } from "@/app/components/Modals/TeamsModals";

export default function Navbar() {
  const {
    open: navOpen,
    onOpen: openNav,
    onClose: closeNav,
  } = useDisclosure();

  const {
    open: inviteOpen,
    onOpen: openInvite,
    onClose: closeInvite,
  } = useDisclosure();

  const {
    open: teamsOpen,
    onOpen: openTeams,
    onClose: closeTeams,
  } = useDisclosure();

  const pathname = usePathname();
  const [isProfileOpen, setProfileOpen] = useState(false);
  // Replace `user` with `authToken`, and `logout` with `signOut`.
  const { authToken, signOut } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const textColor = useColorModeValue("gray.800","#eeeeee");
  const navbgColor = useColorModeValue("rgba(230, 234, 243, 0.19)","gray.900");
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
      onClick: openInvite,
    },
    {
      label: "Profile",
      onClick: () => {if (!isProfileOpen) setProfileOpen(true)},
      icon: User,
    },
  ];
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);
  const { toggleColorMode } = useColorMode()

  return (
    <>
      <Box position="sticky" top={0} zIndex="1000" bg={navbgColor}>
        <Flex as="nav" align="center" justify="space-between" pr={"1%"} position="relative">
          <Box display="flex" alignItems="center" gap="0">
            <BackForward />
            <Box fontWeight="bold" display={{ base: "none", sm:"block"}} fontSize={["md", "lg"]} alignContent="center" color={textColor} px={2} py={1} borderRadius={"xl"} _hover={{backgroundColor: "whiteAlpha.500"}}>
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
            <HStack gap={2} align="right" margin={1} display={{ base: "none", md: "flex" }}>
              {authToken &&
                links.map((item) => {
                  const button = (
                    <IconButton
                        aria-label={item.label}
                        variant="ghost"
                        onClick={item.onClick ?? undefined}
                        color={item.active ? "orange.400" : undefined}
                        borderRadius={"xl"}
                      >{<Icon as={item.icon} />}</IconButton>
                  );

                  return (
                    <Tooltip key={item.label} content={item.label} showArrow openDelay={100} closeDelay={0}>
                      {item.href ? (
                        <Link
                          as={NextLink}
                          href={item.href}
                          _hover={{ textDecoration: "none", color: "orange.400" }}
                        >
                          {button}
                        </Link>
                      ) : (
                        button
                      )}
                    </Tooltip>
                  );
                })}
              
            </HStack>
            {isProfileOpen && 
            <Box ref={profileRef} className={"dropdown-color"} position="absolute" top="100%" right="6" width="20vw" borderWidth="1px" borderColor="border.muted" borderRadius="lg" boxShadow={"lg"} height="fit-content" pb={2}>
              <Text fontSize={12} p={4}>RWH Engineering</Text>
              <Separator borderColor={"fg.muted"}/>
              <HStack gap={1}>
                <Box p={2} pr={0} w="50%">
                  <Text fontSize={"xs"} color="gray" py={2} px={4}>Account</Text>
                  <VStack align={"left"} gap={0} fontSize={"sm"}>
                    <HStack className="button-hover" pl={2}><User />My profile</HStack>
                    <HStack className="button-hover" pl={2}><User />Organization</HStack>
                    <HStack className="button-hover" pl={2} onClick={() => {
                      setProfileOpen(false);
                      openTeams();
                    }}><BsPeopleFill />Teams</HStack>
                    <HStack className="button-hover" pl={2} onClick={signOut}><FiLogOut />Log out</HStack>
                  </VStack>
                </Box>
                <Box p={2} pl={0} w="50%">
                  <Text fontSize={"xs"} color="gray" py={2} px={4}>More</Text>
                  <VStack align={"left"} gap={0} fontSize={"sm"}>
                    <HStack className="button-hover" px={2} onClick={() => {
                      setProfileOpen(false);
                      openInvite();
                    }}><BsPersonAdd />Invite Members</HStack>
                    <HStack className="button-hover" px={2}><BsQuestionLg />Help</HStack>
                    <HStack className="button-hover" px={2} onClick={toggleColorMode}><ColorModeIcon />Change Theme</HStack>
                  </VStack>
                </Box>
              </HStack>
            </Box>
            }
            <HStack gap={2}>
              {/* drawer toggle on mobile */}
              <IconButton
                aria-label="Menu"
                variant="ghost"
                display={{ md: "none" }}
                onClick={navOpen ? closeNav : openNav}
              ><Menu size={24} /></IconButton>
            </HStack>
          </Flex>
        </Flex>
      </Box>
      {/* ——————————————————————— MOBILE DRAWER ——————————————————————— */}
      <Drawer.Root open={navOpen} onOpenChange={() => openNav} onInteractOutside={closeNav}>
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
      <Dialog.Root
        size="sm"
        open={inviteOpen}
        onOpenChange={(d) => (d.open ? openInvite() : closeInvite())}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content border="2px solid" maxH="80vh" overflowY="auto">
            <Dialog.Header>
              <Dialog.Title>Invite Members</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Field.Root>
                <Field.Label>Email</Field.Label>

                <Group attached w="full" maxW="sm">
                  <Input flex="1" placeholder="Enter an email address to invite..." />
                  <Button bg="blue.600" color="white" variant="outline">
                    <Plus size="sm" />
                  </Button>
                </Group>

                <Field.HelperText>
                  Only emails under your organization can be invited
                </Field.HelperText>
              </Field.Root>

              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
      <TeamsModal isOpen={teamsOpen} onClose={closeTeams} />
    </>
  );
}
