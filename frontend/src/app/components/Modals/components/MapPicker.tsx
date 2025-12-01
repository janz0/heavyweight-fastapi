'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Box,
  HStack,
  Input,
  InputGroup,
  IconButton,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useColorModeValue } from '@/app/src/components/ui/color-mode';
// MapLibre build
const Map = dynamic(
  () => import('react-map-gl/maplibre').then(m => m.default),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-map-gl/maplibre').then(m => m.Marker),
  { ssr: false }
);
const NavigationControl = dynamic(
  () => import('react-map-gl/maplibre').then(m => m.NavigationControl),
  { ssr: false }
);

type Suggestion = {
  display_name: string;
  lat: number;
  lon: number;
};

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
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const [latText, setLatText] = useState('');
  const [lonText, setLonText] = useState('');

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

  useEffect(() => {
    if (typeof lat === 'number') setLatText(lat.toFixed(6));
    else setLatText('');
    if (typeof lon === 'number') setLonText(lon.toFixed(6));
    else setLonText('');
  }, [lat, lon]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    const map = mapRef.current.getMap();
    map.easeTo({ center: [lon, lat], duration: 400 });
  }, [lat, lon]);

  useEffect(() => {
    // clear suggestions if empty or too short
    if (!search.trim() || search.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setSuggestLoading(true);

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', search.trim());
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '5');
        url.searchParams.set('addressdetails', '0');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'en',
          },
        });

        if (!res.ok) throw new Error(`Suggest failed (${res.status})`);

        const data: Array<{ lat: string; lon: string; display_name: string }> =
          await res.json();

        const mapped = data.map(d => ({
          display_name: d.display_name,
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
        }));

        setSuggestions(mapped);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
        console.error('Suggest error', e);
      } finally {
        setSuggestLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [search]);

  const hasPoint = typeof lat === 'number' && typeof lon === 'number';

  const geocode = async (query: string) => {
    if (!query.trim()) return;
    try {
      setSearchLoading(true);
      setSearchError(null);

      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('addressdetails', '1');

      const res = await fetch(url.toString(), {
        headers: {
          // can't set User-Agent from browser; see note below
          'Accept-Language': 'en',
        },
      });

      if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
      const results: Array<{ lat: string; lon: string; display_name: string }> =
        await res.json();

      if (!results.length) {
        throw new Error('No results found for that address');
      }

      const first = results[0];
      const gLat = parseFloat(first.lat);
      const gLon = parseFloat(first.lon);
      if (Number.isNaN(gLat) || Number.isNaN(gLon)) {
        throw new Error('Invalid geocode response');
      }

      onPick(gLat, gLon);
      if (mapRef.current) {
        mapRef.current.getMap().easeTo({
          center: [gLon, gLat],
          zoom: 14,
          duration: 600,
        });
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Geocode failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const searchBg = useColorModeValue('white', 'gray.800');

  const commitLat = () => {
    const v = parseFloat(latText);
    if (!Number.isFinite(v) || v < -90 || v > 90) {
      // reset to prop if invalid
      if (typeof lat === 'number') setLatText(lat.toFixed(6));
      else setLatText('');
      return;
    }
    const currentLon =
      typeof lon === 'number' ? lon : defaultCenter[1] ?? 0;

    onPick(v, currentLon);
    if (mapRef.current) {
      mapRef.current.getMap().easeTo({
        center: [currentLon, v],
        duration: 400,
      });
    }
  };

  const commitLon = () => {
    const v = parseFloat(lonText);
    if (!Number.isFinite(v) || v < -180 || v > 180) {
      if (typeof lon === 'number') setLonText(lon.toFixed(6));
      else setLonText('');
      return;
    }
    const currentLat =
      typeof lat === 'number' ? lat : defaultCenter[0] ?? 0;

    onPick(currentLat, v);
    if (mapRef.current) {
      mapRef.current.getMap().easeTo({
        center: [v, currentLat],
        duration: 400,
      });
    }
  };
  
  return (
    <>
      <Box position="relative" height={height} minH="300px">
        {/* Search bar */}
        <Box position="absolute" zIndex={10} top={3} right={3}>
          <Box bg={searchBg} p={2} borderRadius="md" boxShadow="md">
            <HStack gap={2} align="center">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') geocode(search);
                }}
                placeholder="Search address…"
                size="sm"
              />
              <IconButton
                aria-label="Search address"
                size="sm"
                onClick={() => geocode(search)}
                disabled={searchLoading}
              >
                {searchLoading ? <Spinner size="xs" /> : <Search size={16} />}
              </IconButton>
            </HStack>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <Box
                mt={2}
                maxH="200px"
                overflowY="auto"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
                bg={searchBg}
              >
                {suggestions.map((sug, idx) => (
                  <Box
                    key={`${sug.lat}-${sug.lon}-${idx}`}
                    px={3}
                    py={2}
                    fontSize="xs"
                    cursor="pointer"
                    _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
                    // use onMouseDown so click works even if input loses focus
                    onMouseDown={e => {
                      e.preventDefault();
                      onPick(sug.lat, sug.lon);
                      if (mapRef.current) {
                        mapRef.current.getMap().easeTo({
                          center: [sug.lon, sug.lat],
                          zoom: 14,
                          duration: 600,
                        });
                      }
                      setSuggestions([]);
                      setSearch(sug.display_name);
                    }}
                  >
                    {sug.display_name}
                  </Box>
                ))}
              </Box>
            )}

            {searchError && (
              <Box mt={1}>
                <Text fontSize="xs" color="red.400">
                  {searchError}
                </Text>
              </Box>
            )}

            {suggestLoading && (
              <Box mt={1}>
                <Text fontSize="xs" color="gray.500">
                  Searching…
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        <Map
          ref={mapRef}
          initialViewState={initial}
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          style={{ width: '100%', height: '100%' }}
          onClick={e => {
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
              onDragEnd={e =>
                onPick(+e.lngLat.lat.toFixed(6), +e.lngLat.lng.toFixed(6))
              }
            >
              <Box
                w="16px"
                h="16px"
                bg="#e11d48"
                borderRadius="full"
                border="2px solid white"
                boxShadow="0 0 0 2px rgba(0,0,0,0.25)"
                title="Location"
              />
            </Marker>
          )}
        </Map>
              {/* Coordinate badge */}
        <Box
          position="absolute"
          bottom={2}
          px={3}
          borderRadius="md"
          fontSize="xs"
          lineHeight="short"
        >
          {hasPoint ? (
            <Box display="flex" flexDirection="column" gap={1}>
              <InputGroup startElement="Lat: " startElementProps={{ color: "fg" }}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step={0.000001}
                  min={-90}
                  max={90}
                  size="xs"
                  value={latText}
                  onChange={e => setLatText(e.target.value)}
                  onBlur={commitLat}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  bg="bg"
                  ps="7ch"
                  width="160px"
                />
              </InputGroup>
              <InputGroup startElement="Lon: " startElementProps={{ color: "fg" }}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step={0.000001}
                  min={-90}
                  max={90}
                  size="xs"
                  value={lonText}
                  onChange={e => setLonText(e.target.value)}
                  onBlur={commitLon}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  bg="bg"
                  ps="7ch"
                  width="160px"
                />
              </InputGroup>
            </Box>
          ) : (
            <Box>Click map to set coordinates</Box>
          )}
        </Box>
      </Box>
    </>
  );
}
