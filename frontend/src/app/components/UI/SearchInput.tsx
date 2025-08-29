// components/SearchInput.tsx
import { Input } from "@chakra-ui/react";
import React from "react";

export interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  maxW?: string;
}

export default function SearchInput({ value, placeholder = "Search...", onChange }: SearchInputProps) {
  return (
    <Input
      className="search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}