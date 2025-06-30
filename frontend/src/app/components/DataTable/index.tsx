// components/DataTable/index.tsx
import React from "react";
import { Table, Text, Icon, Flex, Button, Box } from "@chakra-ui/react";
import { useColorMode, useColorModeValue } from "@/app/src/components/ui/color-mode";
import type { DataTableProps } from "./types";
import { CaretUp, CaretDown } from "phosphor-react";

export default function DataTable<T>({
  columns,
  data,
  sortConfig,
  onSort,
  renderRow,
  page = 1,
  totalPages = 1,
  onPageChange,
}: DataTableProps<T>) {
  const { colorMode } = useColorMode();
  const cardBg = colorMode === "light" ? "gray.400" : "gray.700";
  const textSub = colorMode === "light" ? "gray.600" : "gray.400";

  return (
    <>
      <Box maxH="60vh" overflowY="auto">
        <Table.Root
          width="100%"
          size="sm"
          interactive
          showColumnBorder
          stickyHeader
          tableLayout="fixed"
          bg={useColorModeValue("white", "gray.700")}
          borderRadius="lg"
          boxShadow="lg"
          overflowX="auto"
          overflowY="auto"
          maxH="600px"
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
                _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}
              >
                {renderRow(item)}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {onPageChange && totalPages >= 1 && (
        <Flex justify="center" align="center" mt={4} gap={2}>
          <Button
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Prev
          </Button>

          {[...Array(totalPages)].map((_, idx) => {
            const p = idx + 1;
            return (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "solid" : "outline"}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            );
          })}

          <Button
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </Flex>
      )}
    </>
  );
}