'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// MapLibre build
const Map = dynamic(() => import('react-map-gl/maplibre').then(m => m.default), { ssr: false });
const Marker = dynamic(() => import('react-map-gl/maplibre').then(m => m.Marker), { ssr: false });
const NavigationControl = dynamic(
  () => import('react-map-gl/maplibre').then(m => m.NavigationControl),
  { ssr: false }
);

import 'maplibre-gl/dist/maplibre-gl.css';

type MapPickerProps = {
  lat: number | null | undefined;
  lon: number | null | undefined;
  defaultCenter: [number, number]; // [lat, lon]
  onPick: (lat: number, lon: number) => void;
  height?: number;
};

export default function MapPicker({
  lat,
  lon,
  defaultCenter,
  onPick,
  height = 400,
}: MapPickerProps) {
  const mapRef = useRef<MapRef | null>(null);

  const initial = useMemo(
    () => ({
      latitude: typeof lat === 'number' ? lat : defaultCenter[0],
      longitude: typeof lon === 'number' ? lon : defaultCenter[1],
      zoom: 12,
      bearing: 0,
      pitch: 0,
    }),
    [lat, lon, defaultCenter]
  );

  // Re-center when lat/lon change
  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    const map = mapRef.current.getMap();
    // center is [lng, lat]
    map.easeTo({ center: [lon, lat], duration: 400 });
  }, [lat, lon]);

  const hasPoint = typeof lat === 'number' && typeof lon === 'number';
  const fmt = (n: number) => n.toFixed(6);

  return (
    <div style={{ height, minHeight: 300 }} >
      <Map
        ref={mapRef}
        initialViewState={initial}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        // attributionControl // ❌ remove this (or pass options), default is OK
        onClick={(e) => {
          const { lat, lng } = e.lngLat;
          onPick(+lat.toFixed(6), +lng.toFixed(6));
        }}
      >
        <NavigationControl position="top-left" />

        {hasPoint && (
          <Marker
            latitude={lat!}
            longitude={lon!}
            anchor="bottom"
            draggable
            onDragEnd={(e) =>
              onPick(+e.lngLat.lat.toFixed(6), +e.lngLat.lng.toFixed(6))
            }
          >
            <div
              style={{
                width: 16,
                height: 16,
                background: '#e11d48',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 0 0 2px rgba(0,0,0,0.25)',
              }}
              title="Location"
            />
          </Marker>
        )}
      </Map>
       {/* Coordinate badge */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.65)',
          color: 'white',
          fontSize: 12,
          lineHeight: 1.2,
          backdropFilter: 'blur(2px)',
        }}
      >
        {hasPoint ? (
          <>
            <div><strong>Lat:</strong> {fmt(lat!)}</div>
            <div><strong>Lon:</strong> {fmt(lon!)}</div>
          </>
        ) : (
          <div>Click map to set coordinates</div>
        )}
      </div>
    </div>
  );
}
