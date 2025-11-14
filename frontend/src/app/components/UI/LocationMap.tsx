"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Box, HStack, IconButton, Text } from "@chakra-ui/react";

// 1) Import styles & components from react-map-gl/maplibre
import Map, { Marker as MapMarker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { Map as MaplibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed } from "lucide-react";

interface LocationMapProps {
  lat: number;
  lon: number;
  siteImageUrl: string;
  /** Corner coordinates: [ [lon, lat], ... ] clockwise */
  imageCoordinates: [
    [number, number],
    [number, number],
    [number, number],
    [number, number]
  ];
}

export function LocationMap({
  lat,
  lon,
  siteImageUrl,
  imageCoordinates,
}: LocationMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [showLabel, setShowLabel] = useState(false);

  // Add/refresh the raster image overlay on load
  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;
    const rawMap: MaplibreMap = mapRef.current.getMap();

    // avoid duplicate source/layer on re-mounts
    if (!rawMap.getSource("site-photo")) {
      rawMap.addSource("site-photo", {
        type: "image",
        url: siteImageUrl,
        coordinates: imageCoordinates,
      });
    }
    if (!rawMap.getLayer("site-photo-layer")) {
      rawMap.addLayer({
        id: "site-photo-layer",
        source: "site-photo",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
      });
    }
  }, [siteImageUrl, imageCoordinates]);

  const handleRecenter = () => {
    const rawMap = mapRef.current?.getMap();
    if (!rawMap) return;

    rawMap.flyTo({
      center: [lon, lat],
      zoom: rawMap.getZoom(), // or 13 if you want a fixed zoom
      duration: 800,
    });
  };

  // Keep map centered if the coordinates change
  useEffect(() => {
    if (!mapRef.current) return;
    const rawMap = mapRef.current.getMap();
    rawMap.easeTo({ center: [lon, lat], duration: 400 });
  }, [lat, lon]);

  return (
    <Box h="100%">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: lat,
          longitude: lon,
          zoom: 13,
          bearing: 0,
          pitch: 0,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: "100%", height: "100%", borderRadius: "12px" }}
        onLoad={onMapLoad}
        // Note: no onClick = no pin-adding; marker is static and non-draggable
      >
        <NavigationControl position="top-left" />

        <MapMarker
          latitude={lat}
          longitude={lon}
          anchor="bottom"
          draggable={false}
        >
          <div
            style={{
              width: 16,
              height: 16,
              background: "#e11d48",
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 0 0 2px rgba(0,0,0,0.25)",
            }}
            title={"Lat: " + lat.toString() + "\nLon: " + lon.toString()}
          />
        </MapMarker>

        <HStack
          position="absolute"
          left={2}
          bottom={2}
          borderRadius="full"
          zIndex={10}
          bg={showLabel ? "white" : "none"}
          transition="background 300ms ease"
          outlineStyle={"solid"}
          outlineWidth={"1px"}
          outline={showLabel ? "solid 1px" : "none"}
          onMouseEnter={() => setShowLabel(true)}
          onMouseLeave={() => setShowLabel(false)}>
          <IconButton
            aria-label="Recenter map"
            size="xs"
            variant="outline"
            outline="black solid 1px"
            color="black"
            bg="white"
            borderRadius="full"
            onClick={handleRecenter}
            zIndex={15}
          >
            <LocateFixed size={14} />
          </IconButton>
          <Text
            opacity={showLabel ? 1 : 0}
            display="block"
            overflow="hidden"
            whiteSpace="nowrap"
            w={showLabel ? "70px" : "0"}
            ml={showLabel ? 1 : 0}
            transition="opacity 200ms ease, width 300ms ease, margin-left 900ms ease"
            pointerEvents={"none"}
          >
            Re-center
          </Text>
        </HStack>
      </Map>
    </Box>
  );
}