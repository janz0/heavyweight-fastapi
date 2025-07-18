// File: app/components/LoginForm.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Box, Button, Container, Flex, Heading, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import bgImg from '@/app/styles/main-screen.png'
import { Eye, EyeSlash } from "phosphor-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaTwitter, FaGithub } from "react-icons/fa";
import { ColorModeButton } from "@/app/src/components/ui/color-mode";
import { useAuth } from "@/lib/auth";
import { loginUser, } from "@/services/auth";
import { useColorModeValue } from "../src/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster"
import { createUser } from "@/services/auth";

export function LoginForm() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
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
    if (!formIsValid) {
      setShowErrors(true)
      return;
    }
    setShowErrors(false)
    setLoading(true);
    try {
      if (mode === "login") {
        const { access_token } = await loginUser(email, password);
        signIn(access_token);
        toaster.create({
          description: "Logged in successfully",
          type: "success",
          duration: 3000,
        });
      } else {
        await createUser({ email, password, first_name: firstName, last_name: lastName });
        toaster.create({
          description: "Account created successfully",
          type: "success",
          duration: 3000,
        });
        const { access_token } = await loginUser(email, password);
        signIn(access_token);
        toaster.create({
          description: "Logged in as new user",
          type: "success",
          duration: 3000,
        });
      }
    } catch (err) {
      const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "An unexpected error occurred";

        console.error(err);
        toaster.create({
          description:
            mode === "login"
              ? `Login failed: ${message}`
              : `Registration failed: ${message}`,
          type: "error",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
  };
  const [isPwdFocused, setIsPwdFocused] = useState(false);
  const [isUsrFocused, setIsUsrFocused] = useState(false);
  const [isFNFocused, setIsFNFocused] = useState(false);
  const [isLNFocused, setIsLNFocused] = useState(false);
  const floatingPwd = isPwdFocused || Boolean(password);
  const floatingUsr = isUsrFocused || Boolean(email);
  const floatingFN = isFNFocused || Boolean(firstName);
  const floatingLN = isLNFocused || Boolean(lastName);
  const [showErrors,   setShowErrors]   = useState(false)   

  // --- validation rules
  const emailIsValid    = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const pwdIsValid      = useMemo(() => password.length >= 8,       [password]);
  const firstIsValid    = useMemo(() => firstName.trim().length > 0, [firstName]);
  const lastIsValid     = useMemo(() => lastName.trim().length > 0,  [lastName]);
  const formIsValid     = mode === "login"
    ? emailIsValid && pwdIsValid
    : emailIsValid && pwdIsValid && firstIsValid && lastIsValid;

  useEffect(() => {
    setEmail("")
    setPassword("")
    setFirstName("")
    setLastName("")
    // if you want to clear focus flags too:
    setIsUsrFocused(false)
    setIsPwdFocused(false)
    setIsFNFocused(false)
    setIsLNFocused(false)
  }, [mode])

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
                <Box as="form" onSubmit={handleSubmit}>
                  <VStack gap={4} align="stretch" position="relative">
                    {mode === "register" && (
                      <Flex gap={4} flexDir={"row"}>
                        <Box position="relative" flex="1">
                          <Input
                            onChange={e => {setFirstName(e.target.value); setShowErrors(false)}}
                            onFocus={() => setIsFNFocused(true)}
                            onBlur={() => setIsFNFocused(false)}
                            bg={inputBg}
                            _autofill={{
                              boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                              WebkitTextFillColor: floatingFN ? `currentColor` : 'transparent',
                            }}
                            _focus={{
                              borderColor: focusColor,
                            }}
                            borderColor={showErrors && !firstIsValid ? "red.500" : undefined}
                            required
                          />
                          <Text
                            as="label"
                            htmlContent="firstName"
                            position="absolute"
                            truncate
                            text-overflow="ellipsis"
                            left="0.75rem"
                            w="calc(100% - 1rem)"
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
                          {showErrors && !firstIsValid && (
                            <Text color="red.500" fontSize="sm" mt="1">
                              Please enter your first name
                            </Text>
                          )}
                        </Box>
                        <Box position="relative" flex="1">
                          <Input
                            onChange={e => {setLastName(e.target.value); setShowErrors(false)}}
                            onFocus={() => setIsLNFocused(true)}
                            onBlur={() => setIsLNFocused(false)}
                            bg={inputBg}
                            _autofill={{
                              boxShadow: `0 0 0px 1000px ${inputBg} inset`,
                              WebkitTextFillColor: floatingLN ? `currentColor` : 'transparent',
                            }}
                            _focus={{
                              borderColor: focusColor,
                            }}
                            borderColor={showErrors && !lastIsValid ? "red.500" : undefined}
                            required
                          />
                          <Text
                            as="label"
                            htmlContent="lastName"
                            position="absolute"
                            truncate
                            w="calc(100% - 1rem)"
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
                          {showErrors && !lastIsValid && (
                            <Text color="red.500" fontSize="sm" mt="1">
                              Please enter your last name
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    )}
                    {/** Email Label + Input */}
                    <Box position="relative">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {setEmail(e.target.value); setShowErrors(false)}}
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
                        borderColor={showErrors && !emailIsValid ? "red.500" : undefined}
                        required
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
                      {showErrors && !emailIsValid && (
                        <Text color="red.500" fontSize="sm" mt="1">
                          Enter a valid email address
                        </Text>
                      )}
                    </Box>

                    {/** Password Label + Input + toggle */}
                    <Box position="relative" mb={[-3, -5]}>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {setPassword(e.target.value); setShowErrors(false)}}
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
                        borderColor={showErrors && !pwdIsValid ? "red.500" : undefined}
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
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        position="absolute"
                        right="0.5rem"
                        top="50%"
                        transform="translateY(-50%)"
                        size={["sm","md"]}
                        variant="ghost"
                      >{showPassword ? <EyeSlash /> : <Eye />}</IconButton>
                    </Box>
                    {showErrors && !pwdIsValid && (
                      <Text color="red.500" fontSize="sm" mt="1">
                        Password must be at least 8 characters
                      </Text>
                    )}
                    {/** Submit */}
                    <VStack mb={[2, 4]} mt={[2, 4]}>
                      <Button
                        type="submit"
                        loading={loading}
                        loadingText={mode==="login"?"Logging in…":"creating..."}
                        w="full"
                        size={["sm","md"]}
                        h={["2rem"]}
                        bgGradient={buttonLight}//"linear-gradient(to right, #ee7724, #d8363a, #dd3675, #b44593)"
                        boxShadow="0px 3px 6px #888888"
                        _hover={{
                          bgGradient: buttonDark
                            //"linear-gradient(to right, #b44593, #dd3675, #d8363a, #ee7724)",
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
                      {backgroundColor: "gray.200"/*"red.50"*/}
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
                      {backgroundColor: "gray.200"/*"red.50"*/}
                    }
                  >
                    Sign in
                  </Button>
                </HStack>
              )}
                </VStack>
              </Flex>
            </Box>

            {/** Right (marketing) */}
            <Box
              flex="1"
              minW={["100%","50%"]}
              bgGradient={buttonLight}//"linear-gradient(to right, #ee7724, #d8363a, #dd3675, #b44593)"
              p={[4,6,10]}
              display={{base: "none", md: "flex"}}
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
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}