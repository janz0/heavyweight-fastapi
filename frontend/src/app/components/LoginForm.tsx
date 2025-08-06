// File: app/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Box, Button, Container, Flex, Heading, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import { PasswordInput, PasswordStrengthMeter } from "@/components/ui/password-input";
import Link from "next/link";
import bgImg from '@/app/styles/main-screen.png'
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaTwitter, FaGithub } from "react-icons/fa";
import { ColorModeButton } from "@/app/src/components/ui/color-mode";
import { useAuth } from "@/lib/auth";
import { loginUser, } from "@/services/auth";
import { useColorModeValue } from "../src/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster"
import { createUser } from "@/services/auth";

const ALLOWED_DOMAINS = ["rwhengineering.ca"];

type FormValues = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export function LoginForm() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"login"|"register">("login");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "", password: "" },
  });
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // 1) Domain check
    const email = data.email.toLowerCase();
    if (!ALLOWED_DOMAINS.some(d => email.endsWith(`@${d}`))) {
      toaster.create({
        description: `Email must end with ${ALLOWED_DOMAINS.map(d => `@${d}`).join(" or ")}`,
        type: "error",
        duration: 5000,
      });
      return;
    }

    try {
      if (mode === "login") {
        // — LOGIN FLOW —
        const { access_token } = await loginUser(email, data.password);
        signIn(access_token);
        toaster.create({
          description: "Logged in successfully",
          type: "success",
          duration: 3000,
        });
      } else {
        // — REGISTER FLOW —
        await createUser({
          email,
          password: data.password,
          first_name: data.firstName!,
          last_name: data.lastName!,
        });
        toaster.create({
          description: "Account created successfully",
          type: "success",
          duration: 3000,
        });

        // auto-login
        const { access_token } = await loginUser(email, data.password);
        signIn(access_token);
        toaster.create({
          description: "Logged in as new user",
          type: "success",
          duration: 3000,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toaster.create({
        description:
          mode === "login"
            ? `Login failed: ${message}`
            : `Registration failed: ${message}`,
        type: "error",
        duration: 5000,
      });
    }
  };
  // Colors
  const sectionBg   = useColorModeValue("gray.100","gray.800");
  const panelBg     = useColorModeValue("white","gray.700");
  const inputBg     = useColorModeValue("white","gray.700");
  const labelBg     = useColorModeValue("white","gray.700");
  const labelColor  = useColorModeValue("gray.500","gray.300");
  const textColor   = useColorModeValue("gray.800","gray.100");
  const focusColor  = useColorModeValue("blue.500","blue.300");
  const buttonLight = useColorModeValue(
    "linear-gradient(to right, #4D4855, #000000, #4D4855)",
    "linear-gradient(to right, #dfdde2ff, #ffffffff, #dfdde2ff)"
  );
  const buttonDark = useColorModeValue(
    "linear-gradient(to right, #000000, #4D4855, #000000)",
    "linear-gradient(to right, #ffffffff, #dfdde2ff, #ffffffff)"
  );
  const invertedTextColor   = useColorModeValue("gray.100", "gray.800");

  const email = watch("email", "");
  const password = watch("password", "");
  const firstName = watch("firstName", "");
  const lastName = watch("lastName", "");

  const [isPwdFocused, setIsPwdFocused] = useState(false);
  const [isUsrFocused, setIsUsrFocused] = useState(false);
  const [isFNFocused, setIsFNFocused] = useState(false);
  const [isLNFocused, setIsLNFocused] = useState(false);

  const floatingPwd = isPwdFocused || Boolean(password);
  const floatingUsr = isUsrFocused || Boolean(email);
  const floatingFN = isFNFocused || Boolean(firstName);
  const floatingLN = isLNFocused || Boolean(lastName);

  return (
    <Box as="section" bg={sectionBg}>
      <Box pos="fixed" inset={0} bg={panelBg} bgImage={`url(${bgImg.src})`} bgSize={"cover"} bgRepeat={"no-repeat"} filter="blur(8px)"></Box>
      <Container py={[4, 6, 8]}>
        <Flex direction={["column", "column", "row"]} h="90vh" align="center" justify="center">
          <Box
            bg={panelBg}
            rounded="md"
            shadow="lg"
            w={{base: "80%", md: "70%", lg: "60%"}}
            maxH="80%"
            overflow="hidden"
            display="flex"
            position="relative"
          >
            {/** Left (form) */}
            <Box p={[4,6,8]} w="full" flex="1" overflowY="auto">
              <Box textAlign="center" mb={6}>
                <Heading size={["md","lg","xl"]} mb={2}>
                  {mode === 'login' ? "Log in" : "Sign up"}
                </Heading>
              </Box>
              <VStack gap={[2,4,6]} align="stretch">
                <Box as="form" onSubmit={handleSubmit(onSubmit)}>
                  <VStack gap={4} align="stretch" position="relative">
                    {mode === "register" && (
                      <Flex gap={4} flexDir={"row"}>
                        <Box position="relative" flex="1">
                          <Input {...register("firstName", { required: "First Name Required"})}
                            onFocus={() => setIsFNFocused(true)}
                            onBlur={() => setIsFNFocused(false)}
                            _autofill={{
                              boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                              WebkitTextFillColor: floatingFN ? `currentColor` : 'transparent',
                            }}
                            _focus={{
                              borderColor: focusColor,
                            }}
                          />
                          <Text
                            as="label"
                            htmlContent="firstName"
                            position="absolute"
                            truncate
                            text-overflow="ellipsis"
                            left="0.75rem"
                            top={floatingFN ? "-25%" : "50%"}
                            transform={floatingFN ? "translateY(0) scale(0.75)" : "translateY(-50%)"}
                            transformOrigin="left top"
                            transition="all 0.2s ease-out"
                            bg={labelBg}
                            px="0.25rem"
                            color={isFNFocused ? focusColor : labelColor}
                            pointerEvents="none"
                          >
                            First name
                          </Text>
                        </Box>
                        <Box position="relative" flex="1">
                          <Input {...register("lastName", { required: "Last name required"})}
                            onFocus={() => setIsLNFocused(true)}
                            onBlur={() => setIsLNFocused(false)}
                            _autofill={{
                              boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                              WebkitTextFillColor: floatingLN ? `currentColor` : 'transparent',
                            }}
                            _focus={{
                              borderColor: focusColor,
                            }}
                          />
                          <Text
                            as="label"
                            htmlContent="lastName"
                            position="absolute"
                            truncate
                            left="0.75rem"
                            top={floatingLN ? "-25%" : "50%"}
                            transform={floatingLN ? "translateY(0) scale(0.75)" : "translateY(-50%)"}
                            transformOrigin="left top"
                            transition="all 0.2s ease-out"
                            bg={labelBg}
                            px="0.25rem"
                            color={isLNFocused ? focusColor : labelColor}
                            pointerEvents="none"
                          >
                            Last name
                          </Text>
                        </Box>
                      </Flex>
                    )}

                    {/** Email Label + Input */}
                    <Box position="relative">
                      <Input
                        type="email"
                        {...register("email", {
                          required: "Email required",
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: "Invalid email"
                          }
                        })}
                        onFocus={() => setIsUsrFocused(true)}
                        onBlur={() => setIsUsrFocused(false)}
                        _autofill={{
                          boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                          WebkitTextFillColor: floatingUsr ? `currentColor` : 'transparent',
                        }}
                        _focus={{
                          borderColor: focusColor,
                        }}
                      />
                      <Text
                        as="label"
                        htmlContent="email"
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
                        Email
                      </Text>
                    </Box>

                    {/** Password Label + Input + toggle */}
                    <Box position="relative" mb={[-3, -5]}>
                      <PasswordInput
                        {...register("password", {required: "Password required", minLength: { value: 8, message: "Min 8 chars" } })}
                        onFocus={() => setIsPwdFocused(true)}
                        onBlur={() => setIsPwdFocused(false)}
                        _autofill={{
                          boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                          WebkitTextFillColor: floatingPwd ? `currentColor` : 'transparent',
                        }}
                        _focus={{
                          borderColor: errors.password ? "Red" : focusColor,
                        }}
                      />
                      {mode === 'register' && <PasswordStrengthMeter value={password.length} />}
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
                    </Box>
                    {/** Submit */}
                    <VStack mb={[2, 4]} mt={[2, 4]}>
                      <Button
                        type="submit"
                        loading={isSubmitting}
                        loadingText={mode==="login"?"Logging in…":"creating..."}
                        w="full"
                        size={["sm","md"]}
                        h={["2rem"]}
                        bgGradient={buttonLight}
                        boxShadow="0px 3px 6px #888888"
                        _hover={{
                          bgGradient: buttonDark
                        }}
                      >
                        {mode==="login" ? "Log in" : "Create Account"}
                      </Button>
                      <Link href="#!" style={{width: "fit-content", alignSelf: "center"}} onClick={e => {e.preventDefault(); setMode(m => m==="login"?"register":"login");}}>
                        <Text color="gray.400" verticalAlign={"top"}>{mode === "login" ? "Forgot password?" : "Already have an account?"}</Text>
                      </Link>
                    </VStack>
                  </VStack>
                </Box>
              </VStack>
              <Flex justify="center" left={0} right={0} align="center" bottom={"5%"}>
                <VStack>
                  <Flex justify="center" mt={[2, 4]}>
                    <Text color={textColor}>{mode=="login" ? "— or login with —" : "— or sign up with —"}</Text>
                  </Flex>
                  <Flex w="full" justify="center">
                    <HStack gap={4}>
                      <IconButton
                        aria-label="Login with Google"
                        variant="outline"
                        rounded="full"
                        size={["sm","md"]}
                        p={[2,3]}
                      >{<FcGoogle size="24px" />}</IconButton>
                      <IconButton
                        aria-label="Login with Facebook"
                        variant="outline"
                        rounded="full"
                        size={["sm","md"]}
                        p={[2,3]}
                      >{<FaFacebook color="#4267B2" size="20px" />}</IconButton>
                      <IconButton
                        aria-label="Login with Twitter"
                        variant="outline"
                        rounded="full"
                        size={["sm","md"]}
                        p={[2,3]}
                      >{<FaTwitter color="#1DA1F2" size="20px" />}</IconButton>
                      <IconButton
                        aria-label="Login with GitHub"
                        variant="outline"
                        rounded="full"
                        size={["sm","md"]}
                        p={[2,3]}
                      >{<FaGithub size="20px" />}</IconButton>
                    </HStack>
                  </Flex>
                {mode === "login" ? (
                <HStack>
                  <Text display={{base: "none", lg: "block"}} mr={6}>Don`t have an account?</Text>
                  <Button
                    variant="outline"
                    color={textColor}
                    borderColor={textColor}
                    borderWidth={"2px"}
                    onClick={e => {e.preventDefault(); setMode(m => m==="login"?"register":"login");}}
                    _hover={
                      {backgroundColor: "gray.200"}
                    }
                  >
                    Sign Up
                  </Button>
                </HStack>
              ) : (
                <HStack>
                  <Text display={{base: "none", lg: "block"}} mr={6}>Already have an account?</Text>
                  <Button
                    variant="outline"
                    color={textColor}
                    borderColor={textColor}
                    borderWidth={"2px"}
                    onClick={e => {e.preventDefault(); setMode(m => m==="login"?"register":"login");}}
                    _hover={
                      {backgroundColor: "gray.200"}
                    }
                  >
                    Sign in
                  </Button>
                </HStack>
              )}
                </VStack>
              </Flex>
            </Box>
            {/** Right */}
            <Box
              flex="1"
              minW={["100%","50%"]}
              bgGradient={buttonLight}
              p={[4,6,10]}
              display={{base: "none", md: "flex"}}
              position="relative"
              alignItems="center"
              justifyContent="center"
            >
              <ColorModeButton position="absolute" top="1rem" right="1rem" color="white" _hover={{background: "gray.600"}} _dark={{color: "black", _hover: {background: "gray.300"}}}/>
              <VStack gap={4} textAlign="center" maxW="sm">
                <Heading size="md" color={invertedTextColor}>Monitoring Application</Heading>
                <Text fontSize="sm" color={invertedTextColor}>
                  Real-time insights & alerts at a glance
                </Text>
              </VStack>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}