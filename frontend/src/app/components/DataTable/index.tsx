// components/DataTable/index.tsx
import React, { useMemo, useState } from "react";
import { Table, Checkbox, Icon, Text, Flex, Button, Box, IconButton, Heading, Popover, VStack } from "@chakra-ui/react";
import { useColorMode, useColorModeValue } from "@/app/src/components/ui/color-mode";
import type { DataTableProps } from "./types";
import { CaretUp, CaretDown, MagnifyingGlass, Plus, DotsThreeVertical, PencilSimple, Trash } from "phosphor-react";
import CountFooter from "../CountFooter";
import SearchInput from "../SearchInput";
import PageSizeSelect from "../PageSizeSelect";
import Link from "next/link";
import { MonitoringGroupAssignModal } from "../Modals/MonitoringGroupModals";

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export default function DataTable<T extends { id: string; }>({
  name = "",
  color,
  data,
  columns,
  onCreate,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  // Colours
  const { colorMode } = useColorMode();
  const text    = colorMode === 'light' ? 'gray.800' : 'gray.200';
  const textSub = colorMode === "light" ? "gray.600" : "gray.400";
  const checkboxColor = colorMode === "light" ? "gray.400" : "gray.600";
  const checkboxHoverColor = colorMode === "light" ? "black" : "gray.400";
  const row_bg = useColorModeValue("gray.50", "gray.800");

  const [page, setPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100];
  const [pageSize, setPageSize] = useState(10);
  const [selectAll, setSelectAll] = useState(false);
  const [isGrpAssignOpen, setGrpAssign] = useState(false);

  // Search
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc"|"desc" }|null>(null);
  const firstKey = columns[0]?.key

  // Sorted
  const filtered = useMemo(() =>
    data.filter(item => {
      const name = firstKey ? String((item as Record<string, unknown>)[firstKey]) : '';
      return name.toLowerCase().includes(search.toLowerCase());
    }),
    [search, data, firstKey]
  );
  const totalPages = Math.ceil(filtered.length / pageSize);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const { key, direction } = sortConfig;
    return [...filtered].sort((a,b) => {
      const av = getNestedValue(a, key), bv = getNestedValue(b, key);
      if (av == null || bv == null) return av==null? -1:1;
      if (typeof av === "number" && typeof bv === "number")
        return direction==="asc"? av-bv : bv-av;
      return direction==="asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig(sc =>
      sc?.key===key && sc.direction==="asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" }
    );
  };

  React.useEffect(() => {
    if (page > totalPages)
      setPage(1);
  }, [page, totalPages]);

  const pageItems: (number | string)[] = React.useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    const items: (number | string)[] = [1];
    if (left > 2) items.push("…");
    for (let p = left; p <= right; p++) items.push(p);
    if (right < totalPages - 1) items.push("…");
    items.push(totalPages);
    return items;
  }, [page, totalPages]);
  data = sorted.slice((page - 1) * pageSize, page * pageSize)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selectedIds.has(id)){
        next.delete(id);
      }
      else
        next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!selectAll){
      setSelectedIds(new Set(data.map((s) => s.id)));
    }
    else {
      setSelectedIds(new Set());
    }
    setSelectAll(!selectAll);
  };
  function hasKey<K extends PropertyKey>(obj: unknown, key: K): obj is Record<K, unknown> {
    return typeof obj === "object" && obj !== null && key in obj;
  }
  const showAssignGroups = data.length > 0 && hasKey(data[0], "sensor_name");

  return (
    <Box width="full" borderRadius={"md"} borderStyle={"initial"} borderWidth={"2px"} bg="whiteAlpha.50" _dark={{background: "gray.700"}} mb="2" p={4} boxShadow={"md"}>
      <Flex mb={4} align="center" position="relative" w="100%">
        <Heading fontSize="3xl" color={color}>  
          <Text as="span">
            {name.charAt(0).toUpperCase()}
          </Text>
          <Text as="span" fontSize="md" fontWeight="bold" textTransform="uppercase">
            {name.slice(1)}
          </Text>
        </Heading>
        <Flex ml="auto" align="center" gap={4}>
          {showAssignGroups && <>
            <Button
              variant={'solid'}
              borderWidth={"2px"}
              borderColor={"inherit"}
              bg={'inherit'}
              color={"black"}
              _dark={{borderColor: "white"}}
              w="25%"
              onClick={() => setGrpAssign(true)}
            >
              Assign Groups
            </Button>
            <MonitoringGroupAssignModal isOpen={isGrpAssignOpen} onClose={() => setGrpAssign(false)} />
          </>
          }
          <Box minW="20ch" display={{base: "none", sm: "block"}}>
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${name}...`} />
          </Box>
          <IconButton
            display={{base: "block", sm: "none"}}
            aria-label="Search"
            as={MagnifyingGlass}
            variant="outline"
            borderRadius="full"
            borderColor={colorMode==="dark" ? "gray.700" : "gray.300"}
            borderWidth="2px"
            p={2}
            h="fit-content"
            size="md"
            _hover={{ bg: "gray.100" }}
            _active={{ bg: "gray.200" }}
            _dark={{
              _hover: { bg: "whiteAlpha.100" },
              _active: { bg: "whiteAlpha.200" },
            }}
          />
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          <Button onClick={onCreate} borderRadius="md" boxShadow="sm" bg="orange" color={text} size={{base: "xs", md:"sm"}}>
            <Plus/><Text display={{base: "none", md: "block"}}>Add New</Text>
          </Button>
        </Flex>
      </Flex>
      <Box maxH="60vh" overflowY="auto" overflowX="auto">
        <Table.Root
          size="sm"
          interactive
          showColumnBorder
          stickyHeader
          tableLayout="auto"
          bg="white"
          _dark={{background: "black"}}
          borderBottomLeftRadius={"xl"}
          borderTopLeftRadius={"xl"}
          overflow="hidden"
          boxShadow="lg"
          maxH="600px"
          minW={{ md: "container.md", lg: "container.lg" }}  
          p={4}
        >
          <Table.Header>
            <Table.Row color={textSub}>
              <Table.ColumnHeader w="6px" bg={color} p={0} m={0} />
              <Table.ColumnHeader w="48px" textAlign="center" p={1}>
                <Checkbox.Root
                  size="sm"
                  checked={selectAll}
                  onCheckedChange={() => toggleAll()}
                  colorPalette="blue"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control cursor="pointer" _hover={{borderColor: checkboxHoverColor}} borderColor={checkboxColor}/>
                </Checkbox.Root>
              </Table.ColumnHeader>
              {columns.map((col) => (
                <Table.ColumnHeader
                  key={col.key}
                  onClick={() => requestSort(col.key)}
                  cursor="pointer"
                  textAlign="center"
                  whiteSpace="nowrap"
                  _first={{ borderTopLeftRadius: "6px" }}
                  m={0} p={1}
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
                _last={{ borderTopRightRadius: "6px" }}
              >
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {data.map((item, i) => (
              <Table.Row
                key={i}
                _hover={{ bg: row_bg }}
                position="relative"
                overflow="visible"
                bg="transparent"
              >
                {/* Fake Column Cell (aligned left, transparent, doesn't affect layout) */}
                <Table.Cell
                  p={0}
                  m={0}
                  w="6px"
                  position="relative"
                >
                  <Box
                    position="absolute"
                    top={-1}
                    bottom={0}
                    left={0}
                    right={0}
                    bg={color}
                  />
                </Table.Cell>
                <Table.Cell py={1}>
                  <Flex align="center" justify="center" h="100%">
                  <Checkbox.Root size="sm" key={item.id} checked={selectedIds.has(item.id)} colorPalette="blue">
                    <Checkbox.HiddenInput onClick={() => toggleSelection(item.id)}/>
                    <Checkbox.Control cursor="pointer" _hover={{borderColor: checkboxHoverColor}} borderColor={checkboxColor}/>
                  </Checkbox.Root>
                  </Flex>
                </Table.Cell>
                {columns.map((col) => {
                  const value = getNestedValue(item, col.key) ?? "";

                  if (col.key === "project_name")
                    return (
                    <Table.Cell key={col.key} p={0} px={2} textAlign="left" textDecor="underline">
                      <Link href={`/${name}/${getNestedValue(item, "project_number")}`}>{String(value)}</Link>
                    </Table.Cell>
                  )
                  if (col.key === "loc_name" || col.key === "sensor_name" || col.key === "source_name") {
                    return (
                      <Table.Cell key={col.key} p={0} px={2} textAlign="left" textDecor="underline">
                        <Link href={`/${name}/${value}`}>{String(value)}</Link>
                      </Table.Cell>
                    );
                  }

                  if (col.key === "active") {
                    return (
                      <Table.Cell key={col.key} p={0} textAlign="center">
                        <Box
                          display="inline-block"
                          boxSize="10px"
                          borderRadius="full"
                          bg={value ? "green.400" : "red.400"}
                        />
                      </Table.Cell>
                    );
                  }

                  if (typeof value === "string" && (col.key.includes("date") || col.key.includes("created") || col.key.includes("last"))) {
                    return (
                      <Table.Cell key={col.key} p={0} px={2} textAlign="center">
                        {value.includes("T") ? value.split("T")[0] : value}
                      </Table.Cell>
                    );
                  }
                  if (typeof value === "number") {
                    return (
                      <Table.Cell key={col.key} p={0} px={2} textAlign="right">
                        {value}
                      </Table.Cell>
                    )
                  }
                  return (
                    <Table.Cell key={col.key} p={0} px={2} textAlign="left">
                      {String(value)}
                    </Table.Cell>
                  );
                })}
                <Table.Cell p={1} textAlign="center">
                  <Box display={"inline-block"}>
                    <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
                      <Popover.Trigger asChild>
                        <IconButton aria-label="More actions" variant="ghost" size="xs" color="black" borderRadius="full"
                          onClick={(e) => e.stopPropagation()}
                          _hover={{
                            backgroundColor: 'blackAlpha.300',
                          }}
                          _dark={{
                            color: "white",
                            _hover: {backgroundColor: "whiteAlpha.200"}
                          }}
                        >
                          <DotsThreeVertical weight="bold"/>
                        </IconButton>
                      </Popover.Trigger>
                      <Popover.Positioner>
                        <Popover.Content width="64px" height="100px" borderColor={"blackAlpha.600"} _dark={{borderColor: "whiteAlpha.600"}} borderWidth={1}>
                          <Popover.Arrow>
                            <Popover.ArrowTip borderColor={"blackAlpha.600"} borderWidth={1} _dark={{borderColor: "whiteAlpha.600"}}/>
                          </Popover.Arrow>
                          <Popover.Body height="100px" p={0}>
                            <VStack gap={0} justifyContent={"center"} height="inherit">
                              <Button variant="ghost" size="md" onClick={() => onEdit(item)}>
                                <PencilSimple />
                              </Button>
                              <Button variant="ghost" size="md" onClick={() => onDelete(item)}>
                                <Trash />
                              </Button>
                            </VStack>
                          </Popover.Body>
                        </Popover.Content>
                      </Popover.Positioner>
                    </Popover.Root>
                  </Box>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      <Flex w="100%" align="center" position="relative">
        
        {totalPages >= 0 && (
          <Flex w="100%" align="center" justify="center" mt={4} gap={2}>
            <Button
              size="sm"
              onClick={() => setPage(page - 1)}
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
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              )
            )}

            <Button
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </Flex>
        )}
        <Box position="absolute" right={6}><CountFooter count={data.length} total={filtered.length} name={name} color={textSub} /></Box>
      </Flex>
    </Box>
  );
}