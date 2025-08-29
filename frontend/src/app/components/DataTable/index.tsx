// File: app/components/DataTable/index.tsx

// React + Next Imports
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// Chakra Imports + Icons
import { Box, Button, ButtonGroup, Checkbox, Flex, Heading, Icon, IconButton, Pagination, Popover, Table, Text, useToken, VStack } from "@chakra-ui/react";
import { CaretDown, CaretUp, DotsThreeVertical, MagnifyingGlass, PencilSimple, Plus, Trash } from "phosphor-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

// UI Components
import CountFooter from "./CountFooter";
import PageSizeSelect from "./PageSizeSelect";
import SearchInput from "../UI/SearchInput";

// Modals
import { MonitoringGroupAssignModal } from "../Modals/MonitoringGroupModals";

// Types
import type { DataTableProps } from "./types";

// Helper Function
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
  // Page Size Select
  const [page, setPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100];
  const [pageSize, setPageSize] = useState(10);

  // Search
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc"|"desc" }|null>(null);
  const firstKey = columns[0]?.key

  // Checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Group Assign
  const [isGrpAssignOpen, setGrpAssign] = useState(false);
  const [resolvedColor] = useToken("colors", [color ?? "black"]); // resolves colors

  // Get Local Column Widths
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${name}-colWidths`);
      if (saved) return JSON.parse(saved);

      // Initialize widths so they sum up to viewport width
      const totalWidth = window.innerWidth; // current screen width
      const reserved = 36 + 100 + 3; // checkbox col (36px) + actions col (100px)
      const available = totalWidth - reserved;
      const baseWidth = Math.max(MIN_COL_PX, Math.round(available / columns.length));

      return Object.fromEntries(columns.map(c => [c.key, baseWidth]));
    }
    // SSR fallback
    return Object.fromEntries(columns.map(c => [c.key, MIN_COL_PX]));
  });

  // Column Resizing
  const MIN_COL_PX = 60;
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number;} | null>(null);
  const startResize = useCallback((e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation(); // don't trigger sort

    const startX = e.clientX;
    const th = (e.currentTarget as HTMLElement).closest('th');
    if (!th) return;
    const rect = th.getBoundingClientRect();
    const startWidth = rect.width;

    resizingRef.current = { key, startX, startWidth };

    // visual feedback
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMove = (ev: PointerEvent) => {
      const r = resizingRef.current;
      if (!r) return;

      setColWidths(prev => {
        const colIndex = columns.findIndex(c => c.key === r.key);
        if (colIndex === -1 || colIndex === columns.length - 1) return prev;

        const nextKey = columns[colIndex + 1].key;
        const currentWidth = prev[r.key];
        const neighborWidth = prev[nextKey];

        // width based on distance from original column edge
        const proposedCurrent = r.startWidth + (ev.clientX - r.startX);
        let newCurrent = Math.max(MIN_COL_PX, proposedCurrent);
        const appliedDelta = newCurrent - currentWidth;
        let newNeighbor = neighborWidth - appliedDelta;

        if (newNeighbor < MIN_COL_PX) {
          const rollback = MIN_COL_PX - newNeighbor;
          newNeighbor = MIN_COL_PX;
          newCurrent = newCurrent - rollback;
        }

        return {
          ...prev,
          [r.key]: newCurrent,
          [nextKey]: newNeighbor,
        };
      });
    };

    const onEnd = () => {
      resizingRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd, { once: true });

    // Optional: capture pointer for smoother drags
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }, [columns]);

  // Sort/Filter Table
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

  // Page Handling
  const totalPages = Math.ceil(filtered.length / pageSize);
  useEffect(() => {
    if (page > totalPages)
      setPage(1);
  }, [page, totalPages]);
  const startRange = (page - 1) * pageSize;
  const endRange = startRange + pageSize;
  const visibleItems = sorted.slice(startRange, endRange);

  // Checkbox Selections
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

  // Show sensors in group
  function hasKey<K extends PropertyKey>(obj: unknown, key: K): obj is Record<K, unknown> {
    return typeof obj === "object" && obj !== null && key in obj;
  }
  const showAssignGroups = data.length > 0 && hasKey(data[0], "sensor_name");

  // Clamp width to page size
  useEffect(() => {
    const container = document.querySelector(".bg-card"); // or use a ref
    const totalWidth = container?.clientWidth ?? window.innerWidth;

    const reserved = 36 + 100 + 3;
    const available = totalWidth - reserved;

    const sum = Object.values(colWidths).reduce((a, b) => a + b, 0);

    if (Math.abs(sum - available) > 1) {
      const factor = available / sum;
      const entries = Object.entries(colWidths).map(([k, w]) => [k, Math.round(w * factor)]);
      
      // ✅ Snap last column so totals match exactly
      const currentSum = entries.reduce((a, [, w]) => a + (w as number), 0);
      const diff = available - currentSum;
      if (entries.length > 0) {
        entries[entries.length - 1][1] = (entries[entries.length - 1][1] as number) + diff;
      }

      setColWidths(Object.fromEntries(entries));
    }
  }, [colWidths]);

  // Update Local Column Widths
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`${name}-colWidths`, JSON.stringify(colWidths));
    }
  }, [colWidths, name]);

  return (
    <Box width="full">
      <Flex mb={2} align="center" w="100%" className="bg-card">
        <Heading fontSize={{base:"xl", sm: "xl", md: "3xl"}} color={color}>  
          <Text as="span">{name.charAt(0).toUpperCase()}</Text>
          <Text as="span" fontSize={{base:"md", sm: "lg", md: "2xl"}}>{name.slice(1)}</Text>
        </Heading>
        <Flex ml="auto" align="center" gap={{base: 1, sm: 2, md: 3}}>
          <Box display={{base: "none", md: "block"}}>
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${name}...`} />
          </Box>
          <IconButton display={{md: "none"}} aria-label="Search" className="search-button" size={'2xs'} as={MagnifyingGlass} />
          {showAssignGroups && 
          <>
            <Button
              variant={'surface'}
              border='1px solid var(--chakra-colors-border-emphasized)'
              backgroundColor='bg.subtle'
              borderRadius='0.375rem'
              boxShadow='md'
              onClick={() => setGrpAssign(true)}
              fontSize={{base:"2xs", sm: "xs", lg: "sm"}}
              _hover={{bg: 'gray.subtle'}}
              p={2}
            >
              Assign Groups
            </Button>
            <MonitoringGroupAssignModal isOpen={isGrpAssignOpen} onClose={() => setGrpAssign(false)} />
          </>
          }
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={setPageSize} />
          <Button onClick={onCreate} borderRadius='0.375rem' boxShadow="sm" bg="orange" color="black" size={{base: "xs", lg:"sm"}}>
            <Plus/><Text display={{base: "none", md: "block"}}>Add New</Text>
          </Button>
        </Flex>
      </Flex>
      <Box className="bg-card">
        <Table.ScrollArea border='1px solid var(--chakra-colors-border-emphasized)' maxH="70vh" borderRadius='0.375rem' overflowX="auto">
          <Table.Root
            size="sm"
            interactive
            showColumnBorder
            stickyHeader
            tableLayout="fixed"
            borderCollapse="separate"
            borderSpacing={0}
            boxShadow="lg"
            width="100%"
            minW="100%"
            maxW="100%"
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
              <Table.Row color="fg.muted" bg="white">
                <Table.ColumnHeader bg='bg' w="36px" textAlign="center" data-sticky-edge="right" position="sticky" left={0} zIndex={1} borderRight={"none"}
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
                    <Checkbox.Control cursor="pointer" _hover={{borderColor: "bg.inverted"}} borderColor="fg.subtle"/>
                  </Checkbox.Root>
                </Table.ColumnHeader>
                {columns.map((col, i) => (
                  <Table.ColumnHeader
                    bg='bg'
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    cursor="pointer"
                    textAlign="center"
                    w={`${colWidths[col.key]}px`}
                    minW={`${MIN_COL_PX}px`}
                    m={0}
                    {...(i === 0 ? { "data-sticky-edge": "right", position: "sticky", insetInlineStart: "36px", top: 0, borderLeft: "none", zIndex: 9 } : {position: "relative"})}
                  >
                    {col.label}
                    {sortConfig?.key === col.key && (
                      <Icon
                        as={sortConfig.direction === "asc" ? CaretUp : CaretDown}
                        ml={"2"}
                      />
                    )}
                    <Box
                      role="separator"
                      aria-orientation="vertical"
                      tabIndex={0}
                      onPointerDown={(e) => startResize(e, col.key)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight") setColWidths(w => ({ ...w, [col.key]: Math.max(MIN_COL_PX, (w[col.key] ?? 80) + 10) }));
                        if (e.key === "ArrowLeft")  setColWidths(w => ({ ...w, [col.key]: Math.max(MIN_COL_PX, (w[col.key] ?? 80) - 10) }));
                      }}
                      position="absolute"
                      top={0}
                      right={'-4px'}            // a little outside so it’s easy to grab; adjust if needed
                      bottom={0}
                      width="8px"
                      cursor="col-resize"
                      // Make sure dragging the handle doesn't sort:
                      onClick={(e) => e.stopPropagation()}
                      zIndex={1}
                    />
                  </Table.ColumnHeader>
                ))}
                <Table.ColumnHeader
                  bg='bg'
                  textAlign="center"
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
                  _hover={{ bg: "bg.subtle" }}
                >
                  <Table.Cell bg='bg' _hover={{ bg: "bg.subtle" }} py={1} position={"sticky"} data-sticky-edge="right" left={0} borderRight={"none"}
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
                        <Checkbox.Control cursor="pointer" _hover={{borderColor: "bg.inverted"}} borderColor="fg.subtle"/>
                      </Checkbox.Root>
                    </Flex>
                  </Table.Cell>
                  {columns.map((col) => {
                    const value = getNestedValue(item, col.key) ?? "";

                    if (col.key === "project_name")
                      return (
                      <Table.Cell key={col.key} bg="inherit" className="table-cell" textAlign="left" textDecor="underline" position="sticky" data-sticky-edge="right" insetInlineStart="36px">
                        <Link href={`/${name}/${getNestedValue(item, "project_number")}`}>{String(value)}</Link>
                      </Table.Cell>
                    )
                    if (col.key === "loc_name" || col.key === "sensor_name" || col.key === "source_name") {
                      return (
                        <Table.Cell key={col.key} bg="inherit" className="table-cell" textAlign="left" textDecor="underline" position="sticky" data-sticky-edge="right" insetInlineStart="36px">
                          <Link href={`/${name}/${value}`}>{String(value)}</Link>
                        </Table.Cell>
                      );
                    }

                    if (col.key === "active") {
                      return (
                        <Table.Cell key={col.key} className="table-cell" textAlign="center">
                          <Box
                            display="inline-block"
                            boxSize="10px"
                            borderRadius='full'
                            bg={value ? "green.400" : "red.400"}
                          />
                        </Table.Cell>
                      );
                    }

                    if (typeof value === "string" && (col.key.includes("date") || col.key.includes("created") || col.key.includes("last"))) {
                      return (
                        <Table.Cell key={col.key} className="table-cell" textAlign="center">
                          {value.includes("T") ? value.split("T")[0] : value}
                        </Table.Cell>
                      );
                    }
                    if (typeof value === "number") {
                      return (
                        <Table.Cell key={col.key} className="table-cell" textAlign="right">
                          {value}
                        </Table.Cell>
                      )
                    }
                    return (
                      <Table.Cell key={col.key} className="table-cell" textAlign="left">
                        {String(value)}
                      </Table.Cell>
                    );
                  })}
                  <Table.Cell p={0} textAlign="center">
                    <Box display={"inline-block"}>
                      <Popover.Root positioning={{ placement: 'left', strategy: 'fixed', offset: {crossAxis: 0, mainAxis: 0}}}>
                        <Popover.Trigger asChild>
                          <IconButton aria-label="More actions" variant="ghost" size="xs" borderRadius='full' _hover={{backgroundColor: 'bg.emphasized'}}
                            onClick={(e) => e.stopPropagation()}
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
        <Box position="absolute" py={1} right={6}><CountFooter count={data.length} total={filtered.length} name={name} color="fg.muted" /></Box>
      </Flex>
    </Box>
  );
}