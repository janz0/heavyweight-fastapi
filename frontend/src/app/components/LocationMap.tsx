"use client";

import React, { useState, useRef, useCallback } from "react";
import { Box, Text } from "@chakra-ui/react";
import { Tabs, TabList, TabPanels, TabPanel, Tab } from "@chakra-ui/tabs";

// 1) Import styles & components from react-map-gl/maplibre
import Map, { Marker as MapMarker } from "react-map-gl/maplibre";
import type {
  MapLayerMouseEvent,
  MapRef,
  MarkerDragEvent
} from "react-map-gl/maplibre";

// 2) Import the **MapLibre-GL** type, not Mapbox-GL
import type { Map as MaplibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  GoogleMap,
  StreetViewPanorama,
  useJsApiLoader,
  Marker as GMarker,
} from "@react-google-maps/api";

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
  initialMarkers?: [number, number][];
}

export function LocationMap({
  lat: initialLat,
  lon: initialLon,
  siteImageUrl,
  imageCoordinates,
  initialMarkers = [],
}: LocationMapProps) {
  // ─── State for markers ────────────────────────────────────────────────────
  const [markers, setMarkers] = useState(() =>
    initialMarkers.map(([lon, lat]) => ({ lat, lon }))
  );

  // ─── Refs ─────────────────────────────────────────────────────────────────
  // MapRef here is the React-Map-GL wrapper.  .getMap() will return a MaplibreMap.
  const mapRef = useRef<MapRef>(null);
  const panoRef = useRef<google.maps.StreetViewPanorama | null>(null);

  // ─── 1) Click handler: extract lng/lat from MapLayerMouseEvent  ───────────
  const handleMapClick = useCallback((evt: MapLayerMouseEvent) => {
    const { lng, lat } = evt.lngLat;
    setMarkers((prev) => [...prev, { lat, lon: lng }]);
  }, []);

  // ─── 2) Drag-end handler: same fix for LngLat  ─────────────────────────────
  const handleDragEnd = useCallback(
    (evt: MarkerDragEvent, idx: number) => {
      const { lng, lat } = evt.lngLat;
      setMarkers((prev) =>
        prev.map((m, i) => (i === idx ? { lat, lon: lng } : m))
      );
    },
    []
  );

  // ─── 3) onLoad handler: use mapRef.current.getMap() → a MaplibreMap ────────
  const onMapLoad = useCallback(() => {
    if (!mapRef.current) {
      // If the ref isn’t set yet, bail out
      return;
    }

    // 3.a) getMap() returns a Maplibre-GL Map
    const rawMap: MaplibreMap = mapRef.current.getMap();

    // 3.b) Add your image source / layer on the **Maplibre** map
    rawMap.addSource("site-photo", {
        type: "image",
        url: siteImageUrl,
        coordinates: imageCoordinates,
      });
      rawMap.addLayer({
        id: "site-photo-layer",
        source: "site-photo",
        type: "raster",
        paint: { "raster-opacity": 0.8 },
      });
    },
    [siteImageUrl, imageCoordinates]
  );

  // ─── Street View loader (unchanged) ───────────────────────────────────────
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_KEY || "",
    libraries: ["streetView"],
  });
  const [svMarkers, setSvMarkers] = useState<{ lat: number; lng: number }[]>(
    []
  );

  return (
    <Tabs variant="enclosed" colorScheme="teal">
      <TabList>
        <Tab>Map</Tab>
        <Tab>Street View</Tab>
        <Tab>Site Photo</Tab>
      </TabList>
      <TabPanels>
        {/* 1. Interactive Vector Map */}
        <TabPanel p={0}>
          <Box h="490px">
            <Map
              ref={mapRef} // ← assign the MapRef here
              initialViewState={{
                latitude: initialLat,
                longitude: initialLon,
                zoom: 13,
              }}
              mapStyle="https://api.maptiler.com/maps/streets-v2/style.json?key=jhTNNVnrTk3AjXEL4NP1"
              style={{ width: "100%", height: "100%", borderRadius: "24px" }}
              onClick={handleMapClick}
              onLoad={onMapLoad}
            >
              {markers.map((m, i) => (
                <MapMarker
                  key={i}
                  latitude={m.lat}
                  longitude={m.lon}
                  color="yellow"
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, i)}
                />
              ))}
            </Map>
          </Box>
        </TabPanel>

        {/* 2. Street-Level / 360° Imagery */}
        <TabPanel p={0}>
          {isLoaded ? (
            <Box h="400px">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: initialLat, lng: initialLon }}
                zoom={15}
              >
                <StreetViewPanorama
                  options={{
                    position: { lat: initialLat, lng: initialLon },
                    visible: true,
                  }}
                  onLoad={(pano) => {
                    // you can grab the panorama instance here
                    console.log("StreetViewPanorama loaded:", pano);
                  }}
                  onPositionChanged={() => {
                    const pos = panoRef.current?.getPosition();
                    if (pos) {
                      setSvMarkers((prev) => [
                        ...prev,
                        { lat: pos.lat(), lng: pos.lng() },
                      ]);
                    }
                  }}
                />
                {svMarkers.map((m, i) => (
                  <GMarker key={i} position={{ lat: m.lat, lng: m.lng }} />
                ))}
              </GoogleMap>
            </Box>
          ) : (
            <Text>Loading Street View…</Text>
          )}
        </TabPanel>

        {/* 3. Site Photo Overlay (in MapLibre) */}
        <TabPanel p={0}>
          <Box h="400px">
            <Map
              ref={mapRef} // ← reuse the same ref if you want the overlay here
              initialViewState={{
                latitude: initialLat,
                longitude: initialLon,
                zoom: 13,
              }}
              mapStyle="https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY"
              style={{ width: "100%", height: "100%" }}
              onLoad={onMapLoad}
            >
              {markers.map((m, i) => (
                <MapMarker
                  key={i}
                  latitude={m.lat}
                  longitude={m.lon}
                  color="yellow"
                />
              ))}
            </Map>
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
