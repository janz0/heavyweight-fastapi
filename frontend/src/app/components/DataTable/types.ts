// components/DataTable/types.ts
export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T extends { id: string; }> {
  name?: string;
  color?: string;

  data: T[];
  columns: ColumnDef[];
  
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;

  selection?: {
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    toggleAll: () => void;
    allSelected: boolean;
  };
}