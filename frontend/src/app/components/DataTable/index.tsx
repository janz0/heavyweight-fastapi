// components/DataTable/index.tsx
import React from "react";
import { Table, Icon, Flex, Button, Box } from "@chakra-ui/react";
import { useColorMode, useColorModeValue } from "@/app/src/components/ui/color-mode";
import type { DataTableProps } from "./types";
import { CaretUp, CaretDown } from "phosphor-react";
import CountFooter from "../CountFooter";

export default function DataTable<T>({
  columns,
  data,
  sortConfig,
  onSort,
  renderRow,
  page = 1,
  totalPages = 1,
  onPageChange,
  count = 0,
  total = 0,
  name = "",
}: DataTableProps<T>) {
  const { colorMode } = useColorMode();
  const cardBg = colorMode === "light" ? "gray.400" : "gray.700";
  const textSub = colorMode === "light" ? "gray.600" : "gray.400";
  const row_bg = useColorModeValue("gray.50", "gray.600");

  // build a small window of pages with ellipses
  const pageItems: (number | string)[] = React.useMemo(() => {
    if (totalPages <= 7) {
      // if few pages, just list them all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const delta = 2; // how many pages around current
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    const nums: (number | string)[] = [1];

    if (left > 2) {
      nums.push("…");
    }
    for (let p = left; p <= right; p++) {
      nums.push(p);
    }
    if (right < totalPages - 1) {
      nums.push("…");
    }
    nums.push(totalPages);
    return nums;
  }, [page, totalPages]);
  
  return (
    <>
      <Box maxH="60vh" overflowY="auto" overflowX="auto">
        <Table.Root
          size="sm"
          interactive
          showColumnBorder
          stickyHeader
          tableLayout="auto"
          bg={useColorModeValue("white", "gray.700")}
          borderRadius="lg"
          boxShadow="lg"
          maxH="600px"
          minW={{ md: "container.md", lg: "container.lg" }}  
          p={4}
        >
          <Table.Header>
            <Table.Row bg={cardBg} color={textSub}>
              {columns.map((col) => (
                <Table.ColumnHeader
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  cursor="pointer"
                  textAlign="center"
                  whiteSpace="nowrap"
                  w={col.width}
                  _first={{ borderTopLeftRadius: "12px" }}
                >
                  {col.label}
                  {sortConfig?.key === col.key && (
                    <Icon
                      as={sortConfig.direction === "asc" ? CaretUp : CaretDown}
                      boxSize={4}
                      ml={1}
                    />
                  )}
                </Table.ColumnHeader>
              ))}
              <Table.ColumnHeader
                textAlign="center"
                whiteSpace="nowrap"
                _last={{ borderTopRightRadius: "12px" }}
              >
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {data.map((item, i) => (
              <Table.Row
                key={i}
                truncate
                _hover={{ bg: row_bg }}
              >
                {renderRow(item)}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      <Flex w="100%" align="center" position="relative">
        
        {onPageChange && totalPages >= 0 && (
          <Flex w="100%" align="center" justify="center" mt={4} gap={2}>
            <Button
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Prev
            </Button>

            {pageItems.map((item, idx) =>
              typeof item === "string" ? (
                <Box key={`dots-${idx}`} px={2}>
                  {item}
                </Box>
              ) : (
                <Button
                  key={item}
                  size="sm"
                  variant={item === page ? "solid" : "outline"}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              )
            )}

            <Button
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </Flex>
        )}
        <Box position="absolute" right={6}><CountFooter count={count} total={total} name={name} color={textSub} /></Box>
        
      </Flex>
    </>
  );
}