"use client";

import { Badge, Box, Flex, VStack, Text } from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";

interface Sensor {
  id: string;
  name: string;
  type: string;
  unit: string;
  threshold: number;
  data: number;
  timestamp: string;
  active: 0 | 1;
}

// Sample data while fetch isn't set up
const sampleSensors: Sensor[] = [
  {
    id: "s1",
    name: "Extensometer 5",
    type: "Extensometer",
    unit: "mm",
    threshold: 2.0,
    data: 1.5,
    timestamp: "2025-05-14T10:30:00Z",
    active: 1,
  },
  {
    id: "s2",
    name: "Inclinometer A",
    type: "Inclinometer",
    unit: "°",
    threshold: 0.2,
    data: 0.15,
    timestamp: "2025-05-14T09:45:00Z",
    active: 1,
  },
  {
    id: "s3",
    name: "Settlement Plate B",
    type: "Settlement Plate",
    unit: "mm",
    threshold: 0.5,
    data: 0.6,
    timestamp: "2025-05-14T08:20:00Z",
    active: 0,
  },
];

export function SensorsList({ locationId }: { locationId: string }) {
  // Use sample data for now
  const [sensors] = useState<Sensor[]>(sampleSensors);
  console.log(locationId)
  return (
    <VStack gap={2} align="stretch" mt={2}>
      {sensors.map((sensor) => (
        <Link key={sensor.id} href={`/sensors/${sensor.id}`} passHref>
          <Box
            cursor="pointer"
            py={4}
            px={6}
            borderRadius="3xl"
            bg="whiteAlpha.50"
            boxShadow="0px 2px 4px 0px rgba(0, 255, 255, 0.7)"
            transition="all 0.2s"
            _hover={{
              boxShadow: "0 4px 8px rgb(250, 250, 250)",
              transform: "translateY(-2px)",
            }}
            _active={{
              bg: "whiteAlpha.800",
              boxShadow: "0 4px 8px rgba(255, 255, 255, 0.4)",
              transform: "translateY(-1px)",
            }}
          >
            <Flex align="center">
              <Box flex="2">
                <Text fontWeight="bold">{sensor.name}</Text>
                <Text fontSize="sm" color="gray.400">
                  Last reading: {sensor.data}{sensor.unit}
                </Text>
              </Box>
              {/* Sensor Type */}
              <Box flex="1" textAlign="center">
                <Text fontWeight="medium">{sensor.type}</Text>
              </Box>

              {/* Unit */}
              <Box flex="1" textAlign="center">
                <Text fontWeight="medium">{sensor.unit}</Text>
              </Box>

              {/* Threshold */}
              <Box flex="1" textAlign="center">
                <Text fontWeight="medium">{sensor.threshold}</Text>
              </Box>

              {/* Data (Last reading) */}
              <Box flex="1" textAlign="center">
                <Text fontWeight="medium">{sensor.data}</Text>
              </Box>

              {/* Timestamp */}
              <Box flex="1" textAlign="center">
                <Text fontWeight="medium">
                  {new Date(sensor.timestamp).toLocaleString()}
                </Text>
              </Box>

              {/* Active status */}
              <Box flex="1" textAlign="center" pr={4}>
                <Badge bg={sensor.active === 1 ? "green" : "gray"}>
                  {sensor.active === 1 ? "Active" : "Inactive"}
                </Badge>
              </Box>
            </Flex>
          </Box>
        </Link>
      ))}
    </VStack>
  );
}
