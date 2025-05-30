// app/components/LoginForm.tsx
"use client";

import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} w="full">
      {error && <Text color="red.500" mb={2}>{error}</Text>}
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
