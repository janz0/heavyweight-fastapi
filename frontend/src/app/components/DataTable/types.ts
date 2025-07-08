// components/DataTable/types.ts
import { ReactNode } from "react";

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: ColumnDef[];
  data: T[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  renderRow: (item: T) => ReactNode;

  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  count?: number;
  total?: number;
  name?: string;
}