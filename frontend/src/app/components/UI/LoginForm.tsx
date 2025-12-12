// File: app/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Box, Button, Container, defineStyle, Field, Flex, Heading, HStack, Input, InputProps, Text, useControllableState, VStack } from "@chakra-ui/react";
import Link from "next/link";
import bgImg from '@/app/styles/main-screen.png'
import logoImg from '@/app/logoRWH.png'
//import { FcGoogle } from "react-icons/fc";
//import { FaFacebook, FaTwitter, FaGithub } from "react-icons/fa";
import { ColorModeButton, useColorModeValue } from "@/app/src/components/ui/color-mode";
import { PasswordInput, PasswordStrengthMeter } from "@/components/ui/password-input";
import { toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth";
import { createUser, loginUser } from "@/services/auth";

const ALLOWED_DOMAINS = ["rwhengineering.ca"];

type FormValues = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

interface FloatingLabelInputProps extends InputProps {
  label: React.ReactNode
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
}

const FloatingLabelInput = (props: FloatingLabelInputProps) => {
  const { label, onValueChange, value, defaultValue = "", ...rest } = props

  const [inputState, setInputState] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value,
  })

  const [focused, setFocused] = useState(false)
  const shouldFloat = inputState.length > 0 || focused
  const inputBg     = useColorModeValue("white", "#3f3f46");
  const autofillStyles = {
    boxShadow: `0 0 0px 1000px ${inputBg} inset`,
    WebkitTextFillColor: shouldFloat ? "inherit" : "transparent",
    transition: "background-color 9999s ease-out 0s",
  };

  return (
    <Box pos="relative" w="full">
      {label != 'Password' &&
        <Input
          {...rest}
          onFocus={(e) => {
            props.onFocus?.(e)
            setFocused(true)
          }}
          onBlur={(e) => {
            props.onBlur?.(e)
            setFocused(false)
          }}
          onChange={(e) => {
            props.onChange?.(e)
            setInputState(e.target.value)
          }}
          value={inputState}
          data-float={shouldFloat || undefined}
          data-focus={focused || undefined}
          _autofill={autofillStyles}
        />
      }
      {label == 'Password' && 
        <PasswordInput
          {...rest}
          onFocus={(e) => {
            props.onFocus?.(e)
            setFocused(true)
          }}
          onBlur={(e) => {
            props.onBlur?.(e)
            setFocused(false)
          }}
          onChange={(e) => {
            props.onChange?.(e)
            setInputState(e.target.value)
          }}
          value={inputState}
          data-float={shouldFloat || undefined}
          data-focus={focused || undefined}
          _autofill={autofillStyles}
        />
      }
      <Field.Label css={floatingStyles} data-float={shouldFloat || undefined} data-focus={focused || undefined}>
        {label}
      </Field.Label>
    </Box>
  )
}

const floatingStyles = defineStyle({
  pos: "absolute",
  bg: "white",
  px: "0.5",
  top: "2.5",
  insetStart: "3",
  fontWeight: "normal",
  pointerEvents: "none",
  transition: "top 0.1s linear, inset 0.1s linear",
  color: "gray.500",
  _dark: {
    bg: "gray.700",
    color: "gray.200"
  },
  "&[data-float]": {
    top: "-3",
    insetStart: "2",
    fontSize: "12px",
  },
  "&[data-focus]": {
    color: "blue.500",
    _dark: {
      color: "blue.200",
    }
  }
})

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

  const password = watch("password", "");

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
                          <Field.Root required invalid={!!errors.firstName}>
                            <FloatingLabelInput label="First Name" {...register("firstName", { required: "First name required" })} _focus={{borderColor: focusColor}}/>
                          </Field.Root>
                        </Box>
                        <Box position="relative" flex="1">
                          <Field.Root required invalid={!!errors.lastName}>
                            <FloatingLabelInput label="Last Name" {...register("lastName", { required: "Last name required" })} _focus={{borderColor: focusColor}}/>
                          </Field.Root>
                        </Box>
                      </Flex>
                    )}

                    {/** Email Label + Input */}
                    <Box position="relative">
                      <Field.Root required invalid={!!errors.email}>
                        <FloatingLabelInput label="Email" {...register("email", {
                          required: "Email required",
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: "Invalid email"
                          }
                        })} _focus={{borderColor: focusColor}}/>
                      </Field.Root>
                    </Box>

                    {/** Password Label + Input + toggle */}
                    <Box position="relative" mb={[-3, -5]}>
                      <Field.Root required invalid={!!errors.password}>
                        <FloatingLabelInput label="Password" {...register("password", {required: "Password required", minLength: { value: 8, message: "Min 8 chars" } })} _focus={{borderColor: focusColor}} />
                        {mode === 'register' && password.length > 0 && <PasswordStrengthMeter value={password.length} w={"full"}/>}
                      </Field.Root>
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
                  {/*
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
                */}
                {mode === "login" ? (
                <HStack>
                  <Text display={{base: "none", lg: "block"}} mr={3}>Don`t have an account?</Text>
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
                <Box
                  h="50px"
                  w="150px"
                  bgImage={`url(${logoImg.src})`}
                  bgSize="cover"
                  bgRepeat="no-repeat"
                />
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