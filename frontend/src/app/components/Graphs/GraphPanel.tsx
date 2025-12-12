"use client";

import { Box, Select, Portal } from "@chakra-ui/react";
import { Line, Bar, Scatter } from "react-chartjs-2";
import type { ChartOptions, ChartData, ChartType } from "chart.js";
import { createListCollection } from "@chakra-ui/react";
import { useColorMode } from "@/app/src/components/ui/color-mode";

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
function seedFromString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function colorFromSeed(seed: string, mode: "light" | "dark") {
  const h = seedFromString(seed) % 360;
  const s = 65;
  const l = mode === "light" ? 45 : 70;
  return `hsl(${h} ${s}% ${l}%)`;
}

export default function GraphPanel({
  sensorName,
  data,
  config,
  onConfigChange,
}: GraphPanelProps) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const stroke = colorFromSeed(sensorName || "default", colorMode);
  const fill =
    config.type === "line" && isDark
      ? stroke.replace("hsl", "hsla").replace("%)", "% / 0.25)")
      : "transparent";

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

  const axisColor = isDark ? "#E5E7EB" : "#374151";
  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(100, 100, 100, 0.08)";
  const tooltipBg = isDark ? "#111827" : "#F9FAFB";
  const tooltipBorder = isDark ? "#4B5563" : "#E5E7EB";

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
          backgroundColor: config.type === "bar" ? stroke : fill,
          borderColor: stroke,
          borderWidth: 2,
          tension: config.type === "line" ? 0.35 : 0,
          pointRadius: config.type === "line" ? 0 : 3,
          pointHitRadius: 6,
        },
      ],
    };
    options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: axisColor },
        },
        tooltip: {
          enabled: true,
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 1,
          titleColor: axisColor,
          bodyColor: axisColor,
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Time", color: axisColor },
          ticks: { color: axisColor },
          grid: { color: gridColor },
        },
        y: {
          title: { display: true, text: config.field, color: axisColor },
          ticks: { color: axisColor },
          grid: { color: gridColor },
        },
      },
    };
  } else if (config.type === "scatter") {
    chartData = {
      datasets: [
        {
          label: `${sensorName} — ${config.field} vs ${
            config.yField ?? "longitude"
          }`,
          data: data.map((pt) => {
            const xVal = pt[config.field];
            const yVal = pt[config.yField ?? "longitude"];
            return typeof xVal === "number" && typeof yVal === "number"
              ? { x: xVal, y: yVal }
              : null;
          }),
          backgroundColor: stroke,
        },
      ],
    };

    options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: axisColor },
        },
        tooltip: {
          enabled: true,
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 1,
          titleColor: axisColor,
          bodyColor: axisColor,
        },
      },
      scales: {
        x: {
          title: { display: true, text: config.field, color: axisColor },
          ticks: { color: axisColor },
          grid: { color: gridColor },
        },
        y: {
          title: {
            display: true,
            text: config.yField ?? "longitude",
            color: axisColor,
          },
          ticks: { color: axisColor },
          grid: { color: gridColor },
        },
      },
    };
  }

  return (
    <Box h="full" p={2} pt={8} position="relative" border="none">
      {/* Dropdown to change chart type */}
      <Box className="bg-card" position="absolute" bg="gray.200" _dark={{ bg: 'gray.700' }} right={"2%"} top={3} p={1} m={0}>
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
            <Select.Trigger h="25px" minH={0} border="none">
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
