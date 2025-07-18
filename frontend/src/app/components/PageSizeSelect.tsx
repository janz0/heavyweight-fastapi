// components/PageSizeSelect/index.tsx
import React, { useMemo } from "react";
import { Select, createListCollection } from "@chakra-ui/react";
import { useColorModeValue } from "../src/components/ui/color-mode";

export interface PageSizeSelectProps {
  value: number;
  options: number[];
  onChange: (n: number) => void;
  minW?: string;
}

export default function PageSizeSelect({ value, options, onChange }: PageSizeSelectProps) {
  const collection = useMemo(
    () =>
      createListCollection({
        items: options.map((n) => ({ value: n.toString(), label: n.toString() })),
      }),
    [options]
  );

  const bg = useColorModeValue("white", "gray.600");
  const select_bg = useColorModeValue("gray.100","gray.700");
  return (
    <Select.Root
      collection={collection}
      value={value ? [value.toString()] : []}
      onValueChange={(e) => onChange(Number(e.value[0]))}
      minW={"7ch"}
      size="sm"
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger bg={bg} borderRadius="md" boxShadow="sm">
          <Select.ValueText placeholder={options[0].toString()} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {options.map((n) => (
            <Select.Item key={n} item={{ value: n.toString(), label: n.toString() }} _hover={{ bg: select_bg }}>
              {n}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
}