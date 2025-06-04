// File: app/components/LoginForm.tsx
"use client";

import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { loginUser } from "@/services/auth";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  // Pull the 'signIn' method from your auth context:
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1) Call your service to POST to /users/login and get back { access_token, token_type }
      const { access_token } = await loginUser(email, password);

      // 2) Inform the auth context, which will store the token (in a cookie) + re-render
      signIn(access_token);

      // 3) Optionally notify parent
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err) || "Login failed");
      }
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} w="full">
      {error && (
        <Text color="red.500" mb={2}>
          {error}
        </Text>
      )}
      <Stack gap={4}>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" colorScheme="orange">
          Log In
        </Button>
      </Stack>
    </Box>
  );
}
