// components/DataTable/index.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Table, Checkbox, Icon, Text, Flex, Button, Box, IconButton, Heading, Popover, VStack, Pagination, ButtonGroup, useToken } from "@chakra-ui/react";
import { useColorMode, useColorModeValue } from "@/app/src/components/ui/color-mode";
import type { DataTableProps } from "./types";
import { CaretUp, CaretDown, MagnifyingGlass, Plus, DotsThreeVertical, PencilSimple, Trash } from "phosphor-react";
import CountFooter from "../CountFooter";
import SearchInput from "../SearchInput";
import PageSizeSelect from "../PageSizeSelect";
import Link from "next/link";
import { MonitoringGroupAssignModal } from "../Modals/MonitoringGroupModals";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100];
  const [pageSize, setPageSize] = useState(10);
  const [selectAll, setSelectAll] = useState(false);
  const [isGrpAssignOpen, setGrpAssign] = useState(false);
  const [resolvedColor] = useToken("colors", [color ?? "black"]); // resolves colors

  // ...inside your component:
  const MIN_COL_PX = 80;

  // Optional: if your column type supports an initial width, we'll use it.
  // Otherwise default to 160px for each data column.
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${name}-colWidths`);
      if (saved) return JSON.parse(saved);
    }
    return Object.fromEntries(columns.map(c => [c.key, (c as { key: string; initialWidth?: number }).initialWidth ?? 160]));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`${name}-colWidths`, JSON.stringify(colWidths));
    }
  }, [name, colWidths]);
  
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const startResize = useCallback((e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation(); // don't trigger sort

    const startX = e.clientX;
    const startWidth = colWidths[key] ?? 160;
    resizingRef.current = { key, startX, startWidth };

    // visual feedback
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMove = (ev: PointerEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const delta = ev.clientX - r.startX;
      const next = Math.max(MIN_COL_PX, r.startWidth + delta);
      setColWidths(prev => ({ ...prev, [r.key]: next }));
    };

    const end = () => {
      resizingRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end, { once: true });

    // Optional: capture pointer for smoother drags
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }, [colWidths, setColWidths]);

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
  const totalPages = Math.ceil(filtered.length / pageSize);
  React.useEffect(() => {
    if (page > totalPages)
      setPage(1);
  }, [page, totalPages]);

  const startRange = (page - 1) * pageSize;
  const endRange = startRange + pageSize;

  const visibleItems = sorted.slice(startRange, endRange);

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
    <Box width="full">
      <Flex mb={4} align="center" position="relative" w="100%" className="bg-card">
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
              _dark={{borderColor: "gray.700", color: "white"}}
              w="25%"
              onClick={() => setGrpAssign(true)}
            >
              Assign Groups
            </Button>
            <MonitoringGroupAssignModal isOpen={isGrpAssignOpen} onClose={() => setGrpAssign(false)} />
          </>
          }
          <Box display={{base: "none", sm: "block"}}>
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${name}...`} />
          </Box>
          <IconButton
            aria-label="Search"
            className="search-button"
            as={MagnifyingGlass}
            
          />
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          <Button onClick={onCreate} borderRadius="md" boxShadow="sm" bg="orange" color={text} size={{base: "xs", md:"sm"}}>
            <Plus/><Text display={{base: "none", md: "block"}}>Add New</Text>
          </Button>
        </Flex>
      </Flex>
      <Box className="bg-card">
        <Table.ScrollArea borderWidth="1px" maxH="50vh" borderRadius={"md"}>
          <Table.Root
            size="sm"
            interactive
            showColumnBorder
            stickyHeader
            tableLayout="fixed"
            borderCollapse="separate"
            borderSpacing={0}
            _dark={{background: "black"}}
            boxShadow="lg"
            maxH="600px"
            minW={{ md: "container.md", lg: "container.lg" }}
            bg="white"
            css={{
              "& [data-sticky-edge='right']::after": {
                content: '""',
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: "0.06rem",
                backgroundColor: `gray.200`,
                _dark: {backgroundColor: 'gray.800'},
                pointerEvents: "none",
              },
            }}
          >
            <Table.Header>
              <Table.Row color={textSub} bg="white">
                <Table.ColumnHeader bg='bg' minW="36px" w="36px" textAlign="center" data-sticky-edge="right" position="sticky" left={0} zIndex={1} borderRight={"none"}
                  _before={{
                    content: '""',
                    position: "absolute",
                    top: "-1px",
                    bottom: "-1px",
                    left: 0,
                    width: "3px",
                    backgroundColor: resolvedColor,
                    pointerEvents: "none",
                  }}>
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
                {columns.map((col, i) => (
                  <Table.ColumnHeader
                    bg='bg'
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    cursor="pointer"
                    textAlign="center"
                    w={colWidths[col.key] ?? 160}
                    m={0}
                    {...(i === 0 ? { "data-sticky-edge": "right", position: "sticky", insetInlineStart: "36px", top: 0, borderRight: "none", borderLeft: "none", zIndex: 9 } : {position: "relative"})}

                  >
                    {col.label}
                    {sortConfig?.key === col.key && (
                      <Icon
                        as={sortConfig.direction === "asc" ? CaretUp : CaretDown}
                        boxSize={4}
                        ml={1}
                      />
                    )}
                    <Box
                      role="separator"
                      aria-orientation="vertical"
                      tabIndex={0}
                      onPointerDown={(e) => startResize(e, col.key)}
                      onKeyDown={(e) => {
                        // Accessible keyboard resize: ← / → by 10px
                        if (e.key === "ArrowRight") setColWidths(w => ({ ...w, [col.key]: Math.max(MIN_COL_PX, (w[col.key] ?? 160) + 10) }));
                        if (e.key === "ArrowLeft")  setColWidths(w => ({ ...w, [col.key]: Math.max(MIN_COL_PX, (w[col.key] ?? 160) - 10) }));
                      }}
                      position="absolute"
                      top={0}
                      right={'-4px'}            // a little outside so it’s easy to grab; adjust if needed
                      bottom={0}
                      width="8px"
                      cursor="col-resize"
                      _hover={{ bg: "blackAlpha.200" }}
                      _dark={{ _hover: { bg: "whiteAlpha.200" } }}
                      // Make sure dragging the handle doesn't sort:
                      onClick={(e) => e.stopPropagation()}
                      zIndex={1}
                    />
                  </Table.ColumnHeader>
                ))}
                <Table.ColumnHeader
                  bg='bg'
                  textAlign="center"
                  whiteSpace="nowrap"
                  w="100px"
                >
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {visibleItems.map((item, i) => (
                <Table.Row
                  key={i}
                  _hover={{ bg: row_bg }}
                  position="relative"
                  
                >
                  <Table.Cell bg='bg' _hover={{ bg: row_bg }} py={1} position={"sticky"} data-sticky-edge="right" left={0} borderRight={"none"}
                    _before={{
                      content: '""',
                      position: "absolute",
                      top: "-1px",
                      bottom: "-1px",
                      left: 0,
                      width: "3px",
                      backgroundColor: resolvedColor,
                      pointerEvents: "none",
                    }}>
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
                      <Table.Cell bg='bg' _hover={{ bg: row_bg }} borderRight={"none"} key={col.key} overflow="hidden" p={0} px={2} textAlign="left" textDecor="underline" position="sticky" data-sticky-edge="right" insetInlineStart="36px">
                        <Link href={`/${name}/${getNestedValue(item, "project_number")}`}>{String(value)}</Link>
                      </Table.Cell>
                    )
                    if (col.key === "loc_name" || col.key === "sensor_name" || col.key === "source_name") {
                      return (
                        <Table.Cell bg='bg' _hover={{ bg: row_bg }} borderRight={"none"} key={col.key} overflow="hidden" p={0} px={2} textAlign="left" textDecor="underline" position="sticky" data-sticky-edge="right" insetInlineStart="36px">
                          <Link href={`/${name}/${value}`}>{String(value)}</Link>
                        </Table.Cell>
                      );
                    }

                    if (col.key === "active") {
                      return (
                        <Table.Cell key={col.key} p={0} overflow="hidden" textAlign="center">
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
                        <Table.Cell key={col.key} overflow="hidden" p={0} px={2} textAlign="center">
                          {value.includes("T") ? value.split("T")[0] : value}
                        </Table.Cell>
                      );
                    }
                    if (typeof value === "number") {
                      return (
                        <Table.Cell key={col.key} overflow="hidden" p={0} px={2} textAlign="right">
                          {value}
                        </Table.Cell>
                      )
                    }
                    return (
                      <Table.Cell key={col.key} overflow="hidden" p={0} px={2} textAlign="left">
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
        </Table.ScrollArea>
      </Box>
      <Flex w="100%" justify="center" position="relative">
        <Pagination.Root p={2} count={filtered.length} pageSize={pageSize} defaultPage={1} onPageChange={(e) => setPage(e.page)}>
          <ButtonGroup variant="ghost" size="sm">
            <Pagination.PrevTrigger asChild>
              <IconButton>
                <LuChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Pagination.Items
              render={(page) => (
                <IconButton variant={{ base: "ghost", _selected: "outline" }}>
                  {page.value}
                </IconButton>
              )}
            />

            <Pagination.NextTrigger asChild>
              <IconButton>
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
        <Box position="absolute" py={1} right={6}><CountFooter count={data.length} total={filtered.length} name={name} color={textSub} /></Box>
      </Flex>
    </Box>
  );
}