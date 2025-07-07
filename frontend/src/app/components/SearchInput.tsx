// components/SearchInput.tsx
import { Input } from "@chakra-ui/react";
import { useColorModeValue } from "../src/components/ui/color-mode";
import React from "react";

export interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  maxW?: string;
}

export default function SearchInput({ value, placeholder = "Search...", onChange, maxW = "400px" }: SearchInputProps) {
  const bg = useColorModeValue("white", "gray.600");
  const placeholderColor = useColorModeValue("gray.600", "white");

  return (
    <Input
      placeholder={placeholder}
      _placeholder={{ color: placeholderColor }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxW={maxW}
      w="100%"
      variant="outline"
      borderRadius="md"
      boxShadow="sm"
      bg={bg}
    />
  );
}