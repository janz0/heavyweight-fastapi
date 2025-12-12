// Shared column type
export interface Column {
  key: string;
  label: string;
}

export const projectColumns: Column[] = [
  { key: "project_name", label: "Project" },
  { key: "project_number", label: "Number" },
  { key: "description", label: "Description" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "locations_count", label: "Locations" },
  { key: "active", label: "Status" },
];

export const locationColumns: Column[] = [
  { key: 'loc_name', label: 'Location Name' },
  { key: 'loc_number', label: 'Location Number' },
  { key: 'details.project_name', label: 'Project' },
  { key: 'lat', label: 'Latitude' },
  { key: 'lon', label: 'Longitude' },
  { key: 'created_at', label: 'Created' },
  { key: 'last_updated', label: 'Updated' },
  { key: 'frequency', label: 'Frequency' },
  { key: "active", label: 'Status' },
];

export const sourcesColumns: Column[] = [
  { key: "source_name",         label: "Source Name" },
  { key: "details.loc_name",    label: "Location" },
  { key: "folder_path",         label: "Folder Path" },
  { key: "root_directory",      label: "Root Directory" },
  { key: "file_keyword",        label: "File Keyword" },
  { key: "file_type",           label: "File Type" },
  { key: "source_type",         label: "Source Type" },
  { key: "last_updated",        label: "Last Data Upload" },
  { key: "config",              label: "Config" },
  { key: "active",              label: "Status" },
];

export const sensorColumns: Column[] = [
  { key: "sensor_name",     label: "Sensor Name" },
  { key: "sensor_type",     label: "Sensor Type" },
  { key: "details.mon_source_name",   label: "Source" },
  { key: "details.group_name", label: "Sensor Group" },
  { key: "created_at",      label: "Created" },
  { key: "last_updated",    label: "Updated" },
  { key: "sensor_data",     label: "Sensor Data" },
  { key: "active",          label: "Active" },
];

export const groupColumns: Column[] = [
  { key: "group_name",   label: "Group Name" },
  { key: "group_type",   label: "Group Type" },
  { key: "data",         label: "Data" },
  { key: "created_at",   label: "Created" },
  { key: "last_updated", label: "Updated" },
  { key: "active",       label: "Active" },
];