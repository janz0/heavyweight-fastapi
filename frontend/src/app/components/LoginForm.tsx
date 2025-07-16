// File: app/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { Box, Button, Container, Flex, Heading, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import bgImg from '@/app/styles/main-screen.png'
import { Eye, EyeSlash } from "phosphor-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaTwitter, FaGithub } from "react-icons/fa";
import { ColorModeButton } from "@/app/src/components/ui/color-mode";
import { useAuth } from "@/lib/auth";
import { loginUser } from "@/services/auth";
import { useColorModeValue } from "../src/components/ui/color-mode";

export function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Colors
  const sectionBg   = useColorModeValue("gray.100","gray.800");
  const panelBg     = useColorModeValue("white","gray.700");
  const inputBg     = useColorModeValue("white","gray.600");
  const labelBg     = useColorModeValue("white","gray.700");
  const labelColor  = useColorModeValue("gray.500","gray.300");
  const textColor   = useColorModeValue("gray.800","gray.100");
  const focusColor  = useColorModeValue("blue.500","blue.300");
  const buttonLight = useColorModeValue(
    "linear-gradient(to right, #4D4855, #000000, #4D4855)",
    "linear-gradient(to right, #a399b3ff, #ffffffff, #a399b3ff)"  // whatever your dark‐mode gradient is
  );
  const buttonDark = useColorModeValue(
    "linear-gradient(to right, #000000, #4D4855, #000000)",
    "linear-gradient(to right, #ffffffff, #a399b3ff, #ffffffff)"  // whatever your dark‐mode gradient is
  );
  const invertedTextColor   = useColorModeValue("gray.100", "gray.800");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await loginUser(email, password);
      signIn(access_token);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const [isPwdFocused, setIsPwdFocused] = useState(false);
  const [isUsrFocused, setIsUsrFocused] = useState(false);
  const floatingPwd = isPwdFocused || Boolean(password);
  const floatingUsr = isUsrFocused || Boolean(email);

  return (
    <Box as="section" minH="100vh" bg={sectionBg}>
      <Box pos="fixed" inset={0} minH="100vh" bg={panelBg} bgImage={`url(${bgImg.src})`} bgSize={"cover"} bgRepeat={"no-repeat"} filter="blur(8px)"></Box>
      <Container maxW="container.xl" py={5} h="100vh">
        <Flex h="100%" align="center" justify="center">
          <Box
            bg={panelBg}
            rounded="md"
            shadow="lg"
            w={{ base: "100%", md: "80%", lg: "60%" }}
            overflow="hidden"
          >
            <Flex h="100%">
              {/** Left (form) */}
              <Box w={{ base: "100%", md: "50%" }} p={{ base: 6, md: 10 }}>
                <VStack gap={12} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" mb={4}>
                      RWH Engineering Inc
                    </Heading>
                  </Box>

                  <Box as="form" onSubmit={handleSubmit}>
                    <VStack gap={4} align="stretch">

                      {/** Email Label + Input */}
                      <Box position="relative">
                        <Input
                          type="email"
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setIsUsrFocused(true)}
                          onBlur={() => setIsUsrFocused(false)}
                          bg={inputBg}
                          _autofill={{
                            boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                            WebkitTextFillColor: floatingUsr ? `currentColor` : 'transparent',
                          }}
                          _focus={{
                            borderColor: focusColor,
                          }}
                          required
                        />
                        <Text
                          as="label"
                          htmlContent="username"
                          position="absolute"
                          left="0.75rem"
                          top={floatingUsr ? "-25%" : "50%"}
                          transform={floatingUsr ? "translateY(0) scale(0.75)" : "translateY(-50%)"}
                          transformOrigin="left top"
                          transition="all 0.2s ease-out"
                          bg={labelBg}
                          px="0.25rem"
                          color={isUsrFocused ? focusColor : labelColor}
                          pointerEvents="none"
                        >
                          Username
                        </Text>
                      </Box>

                      {/** Password Label + Input + toggle */}
                      <Box position="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setIsPwdFocused(true)}
                          onBlur={() => setIsPwdFocused(false)}
                          _autofill={{
                            boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                            WebkitTextFillColor: floatingPwd ? `currentColor` : 'transparent',
                          }}
                          _focus={{
                            bg: inputBg,
                            borderColor: focusColor,
                          }}
                          required
                          pr="3rem"
                        />
                        <Text
                          as="label"
                          htmlContent="password"
                          position="absolute"
                          left="0.75rem"
                          top={floatingPwd ? "-25%" : "50%"}
                          transform={floatingPwd ? "translateY(0) scale(0.75)" : "translateY(-50%)"}
                          transformOrigin="left top"
                          transition="all 0.2s ease-out"
                          bg={labelBg}
                          px="0.25rem"
                          color={isPwdFocused ? focusColor : labelColor}
                          pointerEvents="none"
                        >
                          Password
                        </Text>
                        <IconButton
                          ml={2}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowPassword((v) => !v)}
                          position="absolute"
                          right="0.5rem"
                          top="50%"
                          transform="translateY(-50%)"
                          size="sm"
                          variant="ghost"
                        >{showPassword ? <EyeSlash /> : <Eye />}</IconButton>
                      </Box>

                      {/** Submit */}
                      <VStack mb={12}>
                        <Button
                          type="submit"
                          loading={loading}
                          loadingText="Logging in…"
                          w="full"
                          h="2rem"
                          bgGradient={buttonLight}//"linear-gradient(to right, #ee7724, #d8363a, #dd3675, #b44593)"
                          boxShadow="0px 3px 6px #888888"
                          _hover={{
                            bgGradient: buttonDark
                              //"linear-gradient(to right, #b44593, #dd3675, #d8363a, #ee7724)",
                          }}
                        >
                          Log in
                        </Button>

                        <Link href="#!" style={{width: "fit-content", alignSelf: "center"}}>
                          <Text color="gray.400" verticalAlign={"top"}>Forgot password?</Text>
                        </Link>
                        <Flex w="full" justify="center" mt={4}>
                          <Text color={textColor}>— or login with —</Text>
                        </Flex>
                        <Flex w="full" justify="center">
                        <HStack gap={4}>
                          <IconButton
                            aria-label="Login with Google"
                            variant="outline"
                            rounded="full"
                          >{<FcGoogle size="24px" />}</IconButton>
                          <IconButton
                            aria-label="Login with Facebook"
                            variant="outline"
                            rounded="full"
                          >{<FaFacebook color="#4267B2" size="20px" />}</IconButton>
                          <IconButton
                            aria-label="Login with Twitter"
                            variant="outline"
                            rounded="full"
                          >{<FaTwitter color="#1DA1F2" size="20px" />}</IconButton>
                          <IconButton
                            aria-label="Login with GitHub"
                            variant="outline"
                            rounded="full"
                          >{<FaGithub size="20px" />}</IconButton>
                        </HStack>
                      </Flex>
                      </VStack>
                      
                      <Flex justify="center" align="center">
                        <Text mr={2} >Don`t have an account?</Text>
                        <Button
                          variant="outline"
                          color={textColor}
                          borderColor={textColor}
                          borderWidth={"2px"}
                          _hover={
                            {backgroundColor: "gray.200"/*"red.50"*/}
                          }
                        >
                          Create New
                        </Button>
                      </Flex>
                    </VStack>
                  </Box>
                </VStack>
              </Box>

              {/** Right (marketing) */}
              <Box
                w={{ base: "100%", md: "50%" }}
                bgGradient={buttonLight}//"linear-gradient(to right, #ee7724, #d8363a, #dd3675, #b44593)"
                p={{ base: 6, md: 10 }}
                display="flex"
                position="relative"
                alignItems="center"
                justifyContent="center"
              >
                <ColorModeButton position="absolute" top="1rem" right="1rem" color="white" _dark={{color: "black"}}/>
                <VStack gap={4} textAlign="center" maxW="sm">
                  <Heading size="md" color={invertedTextColor}>Monitoring Application</Heading>
                  <Text fontSize="sm" color={invertedTextColor}>
                    Real-time insights & alerts at a glance
                  </Text>
                </VStack>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}