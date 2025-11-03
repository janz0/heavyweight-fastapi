"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Box } from "@chakra-ui/react";

// 1) Import styles & components from react-map-gl/maplibre
import Map, { Marker as MapMarker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { Map as MaplibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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

  // Keep map centered if the coordinates change
  useEffect(() => {
    if (!mapRef.current) return;
    const rawMap = mapRef.current.getMap();
    rawMap.easeTo({ center: [lon, lat], duration: 400 });
  }, [lat, lon]);

  const fmt = (n: number) => n.toFixed(6);

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
          {/* simple styled dot (same vibe as your picker) */}
          <div
            style={{
              width: 16,
              height: 16,
              background: "#e11d48",
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 0 0 2px rgba(0,0,0,0.25)",
            }}
            title={"Lat: " + lat.toString() + "\nLon: " + lat.toString()}
          />
        </MapMarker>

        {/* Coordinate badge */}
        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            padding: "6px 10px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.65)",
            color: "white",
            fontSize: 12,
            lineHeight: 1.2,
            backdropFilter: "blur(2px)",
          }}
        >
          <div><strong>Lat:</strong> {fmt(lat)}</div>
          <div><strong>Lon:</strong> {fmt(lon)}</div>
        </div>
      </Map>
    </Box>
  );
}