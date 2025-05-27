"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Text,
} from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, TabPanel, Tab } from "@chakra-ui/tabs";
import Map, { Marker as MapMarker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  GoogleMap,
  StreetViewPanorama,
  useJsApiLoader,
  Marker as GMarker,
} from '@react-google-maps/api';

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
  // Map markers state
  const [markers, setMarkers] = useState(
    () => initialMarkers.map(([lon, lat]) => ({ lat, lon }))
  );
  const mapRef = useRef<any>(null);
  const panoRef = useRef<google.maps.StreetViewPanorama|null>(null);
  // Add marker on click
  const handleMapClick = useCallback((evt: any) => {
    const [lng, lat] = evt.lngLat;
    setMarkers((prev) => [...prev, { lat, lon: lng }]);
  }, []);

  // Drag end updates marker position
  const handleDragEnd = useCallback((evt: any, idx: number) => {
    const [lng, lat] = evt.lngLat;
    setMarkers((prev) =>
      prev.map((m, i) => (i === idx ? { lat, lon: lng } : m))
    );
  }, []);

  // On map load, add photo overlay
  const onMapLoad = useCallback(({ target: map }: any) => {
    mapRef.current = map;
    map.addSource('site-photo', {
      type: 'image',
      url: siteImageUrl,
      coordinates: imageCoordinates,
    });
    map.addLayer({
      id: 'site-photo-layer',
      source: 'site-photo',
      type: 'raster',
      paint: { 'raster-opacity': 0.8 },
    });
  }, [siteImageUrl, imageCoordinates]);

  // Street View loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_KEY || '',
    libraries: ['streetView'],
  });
  const [svMarkers, setSvMarkers] = useState<{ lat: number; lng: number }[]>([]);

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
              initialViewState={{ latitude: initialLat, longitude: initialLon, zoom: 13 }}
              mapStyle="https://api.maptiler.com/maps/streets-v2/style.json?key=jhTNNVnrTk3AjXEL4NP1"
              style={{ width: '100%', height: '100%', borderRadius: '24px' }}
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
                mapContainerStyle={{ width: '100%', height: '100%' }}
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
                    // when the user navigates within the panorama, you can read pano.getPosition()
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
              initialViewState={{ latitude: initialLat, longitude: initialLon, zoom: 13 }}
              mapStyle="https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY"
              style={{ width: '100%', height: '100%' }}
              onLoad={onMapLoad}
            >
              {markers.map((m, i) => (
                <MapMarker key={i} latitude={m.lat} longitude={m.lon} color="yellow"/>
              ))}
            </Map>
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
