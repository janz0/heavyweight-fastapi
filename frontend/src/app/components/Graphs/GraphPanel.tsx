"use client";

import { Box, Select, Portal } from "@chakra-ui/react";
import { Line, Bar, Scatter } from "react-chartjs-2";
import type { ChartOptions, ChartData, ChartType } from "chart.js";
import { createListCollection } from "@chakra-ui/react";

// Type for your time-series data row
export type SampleRow = {
  timestamp: string; // ISO string
  latitude?: number;
  longitude?: number;
  [key: string]: string | number | undefined; // allow arbitrary fields
};

export type GraphConfig = {
  type: "line" | "bar" | "scatter";
  field: string;
  yField?: string; // used for scatter
};

interface GraphPanelProps {
  sensorName: string;
  data: SampleRow[];
  config: GraphConfig;
  onConfigChange: (c: GraphConfig) => void;
}

export default function GraphPanel({
  sensorName,
  data,
  config,
  onConfigChange,
}: GraphPanelProps) {
  // Define selectable chart types
  const chartTypes = createListCollection({
    items: [
      { label: "Line", value: "line" },
      { label: "Bar", value: "bar" },
      { label: "Scatter", value: "scatter" },
    ],
  });

  // Shared x-axis (timestamps)
  const labels = data.map((d) =>
    new Date(d.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  // Dataset logic per chart type
  let chartData: ChartData<ChartType> | null = null;
  let options: ChartOptions<"line"> | ChartOptions<"bar"> | ChartOptions<"scatter"> | null = null;

  if (config.type === "line" || config.type === "bar") {
    chartData = {
      labels,
      datasets: [
        {
          label: `${sensorName} — ${config.field}`,
          data: data.map((pt) => {
            const val = pt[config.field];
            return typeof val === "number" ? val : null;
          }),
          backgroundColor: "#3B82F6",
          borderColor: "#3B82F6",
          fill: false,
        },
      ],
    };
    options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { title: { display: true, text: "Time" }, grid: { display: false } },
        y: { title: { display: true, text: config.field } },
      },
    };
  } else if (config.type === "scatter") {
    chartData = {
      datasets: [
        {
          label: `${sensorName} — ${config.field} vs ${config.yField ?? "longitude"}`,
          data: data.map((pt) => {
            const xVal = pt[config.field];
            const yVal = pt[config.yField ?? "longitude"];

            return typeof xVal === "number" && typeof yVal === "number"
              ? { x: xVal, y: yVal }
              : null; // Chart.js allows null points
          }),
          backgroundColor: "#10B981",
        },
      ],
    };

    options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { title: { display: true, text: config.field } },
        y: { title: { display: true, text: config.yField ?? "longitude" } },
      },
    };
  }

  return (
    <Box h="full" p={2} pt={8} borderWidth={2} position="relative">
      {/* Dropdown to change chart type */}
      <Box className="bg-card" position="absolute" bg="gray.200" right={"2%"} top={3} p={1} m={0}>
        <Select.Root
          collection={chartTypes}
          w="120px"
          value={[config.type]}
          onValueChange={(e) => {
            const nextType = e.value[0] as GraphConfig["type"];
            onConfigChange({ ...config, type: nextType });
          }}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger h="25px" minH={0}>
              <Select.ValueText fontSize={12} />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {chartTypes.items.map((c) => (
                  <Select.Item item={c} key={c.value}>
                    {c.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Box>

      {/* Render chosen chart */}
      {config.type === "line" && <Line data={chartData as ChartData<"line">} options={options as ChartOptions<"line">} />}
      {config.type === "bar" && <Bar data={chartData as ChartData<"bar">} options={options as ChartOptions<"bar">} />}
      {config.type === "scatter" && <Scatter data={chartData as ChartData<"scatter">} options={options as ChartOptions<"scatter">} />}
    </Box>
  );
}
