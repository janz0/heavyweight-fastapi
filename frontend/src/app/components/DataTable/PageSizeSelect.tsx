// components/PageSizeSelect/index.tsx
import React, { useMemo } from "react";
import { Select, createListCollection } from "@chakra-ui/react";
import { useColorModeValue } from "../../src/components/ui/color-mode";

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
        <Select.Trigger bg={'bg.panel'} border='1px solid var(--chakra-colors-border-emphasized)' borderRadius='0.375rem' boxShadow='md'>
          <Select.ValueText placeholder={options[0].toString()} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {options.map((n) => (
            <Select.Item key={n} item={{ value: n.toString(), label: n.toString() }} _selected={{bg: 'gray.subtle'}} _hover={{ bg: 'gray.subtle' }}>
              {n}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
}