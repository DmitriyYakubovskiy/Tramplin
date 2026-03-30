import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getYandexMapsApiKey, isYandexMapsConfigured, loadYandexMapsApi } from '../../lib/yandexMaps';

export interface YandexMapMarker {
  id: string;
  coordinates: [number, number];
  markerClassName?: string;
  hintHtml?: string;
  balloonHtml?: string;
  draggable?: boolean;
  onClick?: () => void;
  onDragEnd?: (coordinates: [number, number]) => void;
}

interface YandexMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: YandexMapMarker[];
  height?: number | string;
  fitToMarkers?: boolean;
  onMapClick?: (coordinates: [number, number]) => void;
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 5;

const toYandexCoords = ([latitude, longitude]: [number, number]): [number, number] => [longitude, latitude];
const toAppCoords = (coordinates: [number, number]) => [coordinates[1], coordinates[0]] as [number, number];

const buildBounds = (markers: YandexMapMarker[]): [[number, number], [number, number]] => {
  const latitudes = markers.map((item) => item.coordinates[0]);
  const longitudes = markers.map((item) => item.coordinates[1]);

  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
};

const YandexMap = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  height = 400,
  fitToMarkers = true,
  onMapClick,
}: YandexMapProps) => {
  const hasApiKey = isYandexMapsConfigured();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMapsMap | null>(null);
  const ymapsRef = useRef<YMapsApi | null>(null);
  const placemarksRef = useRef<YMapsPlacemark[]>([]);
  const clickHandlerRef = useRef<((event: YMapsMapClickEvent) => void) | null>(null);
  const [loading, setLoading] = useState(hasApiKey);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState('');

  const markersSignature = useMemo(
    () =>
      JSON.stringify(
        markers.map((item) => ({
          id: item.id,
          coordinates: item.coordinates,
          markerClassName: item.markerClassName,
          hintHtml: item.hintHtml,
          balloonHtml: item.balloonHtml,
          draggable: item.draggable,
        })),
      ),
    [markers],
  );

  useEffect(() => {
    let disposed = false;

    if (!containerRef.current) {
      return;
    }

    if (!hasApiKey) {
      return;
    }

    void loadYandexMapsApi()
      .then((ymaps) => {
        if (disposed || !containerRef.current) {
          return;
        }

        ymapsRef.current = ymaps;

        if (!mapRef.current) {
          mapRef.current = new ymaps.Map(
            containerRef.current,
            {
              center: toYandexCoords(center),
              zoom,
              controls: ['zoomControl'],
            },
            {
              suppressMapOpenBlock: true,
            },
          );
        }

        setIsMapReady(true);
        setLoading(false);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (!disposed) {
          setIsMapReady(false);
          setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить карту Яндекса.');
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [center, hasApiKey, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!map || !ymaps || !isMapReady) {
      return;
    }

    placemarksRef.current.forEach((placemark) => map.geoObjects.remove(placemark));
    placemarksRef.current = [];

    markers.forEach((marker) => {
      const markerSize = marker.markerClassName?.includes('marker-favorite') ? 22 : 18;
      const iconLayout = ymaps.templateLayoutFactory.createClass(
        `<div class="tr-marker ${marker.markerClassName ?? ''}"></div>`,
      );

      const placemark = new ymaps.Placemark(
        toYandexCoords(marker.coordinates),
        {
          hintContent: marker.hintHtml,
          balloonContentBody: marker.balloonHtml,
        },
        {
          iconLayout,
          iconShape: {
            type: 'Circle',
            coordinates: [markerSize / 2, markerSize / 2],
            radius: markerSize / 2,
          },
          iconOffset: [-(markerSize / 2), -(markerSize / 2)],
          draggable: marker.draggable ?? false,
          hideIconOnBalloonOpen: false,
          balloonOffset: [0, -14],
        },
      );

      if (marker.onClick) {
        placemark.events.add('click', () => marker.onClick?.());
      }

      if (marker.onDragEnd) {
        placemark.events.add('dragend', () => {
          const nextCoordinates = placemark.geometry.getCoordinates() as [number, number];
          marker.onDragEnd?.(toAppCoords(nextCoordinates));
        });
      }

      map.geoObjects.add(placemark);
      placemarksRef.current.push(placemark);
    });

    if (markers.length > 1 && fitToMarkers) {
      map.setBounds(buildBounds(markers), {
        checkZoomRange: true,
        zoomMargin: 40,
      });
    } else if (markers.length === 1) {
      map.setCenter(toYandexCoords(markers[0].coordinates), Math.max(zoom, 11));
    } else {
      map.setCenter(toYandexCoords(center), zoom);
    }
  }, [center, fitToMarkers, isMapReady, markers, markersSignature, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) {
      return;
    }

    if (clickHandlerRef.current) {
      map.events.remove('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
    }

    if (!onMapClick) {
      return;
    }

    const handleMapClick = (event: YMapsMapClickEvent) => {
      const coordinates = event.get('coords') as [number, number];
      onMapClick(toAppCoords(coordinates));
    };

    clickHandlerRef.current = handleMapClick;
    map.events.add('click', handleMapClick);

    return () => {
      map.events.remove('click', handleMapClick);
    };
  }, [isMapReady, onMapClick]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const effectiveError = error || (!hasApiKey ? 'Карта Яндекса не настроена: добавьте VITE_YANDEX_MAPS_API_KEY в Client/.env.local.' : '');

  if (effectiveError) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 4 }}>
        <Stack spacing={0.75}>
          <Typography fontWeight={700}>Карта временно недоступна</Typography>
          <Typography variant="body2">{effectiveError}</Typography>
          {!getYandexMapsApiKey() && (
            <Typography variant="body2">
              Добавьте ключ Яндекс Карт в `Client/.env.local`: `VITE_YANDEX_MAPS_API_KEY=...`
            </Typography>
          )}
        </Stack>
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', height, borderRadius: 4, overflow: 'hidden' }}>
      <Box ref={containerRef} className="tr-ymap-container" sx={{ width: '100%', height: '100%' }} />
      {loading && (
        <Box className="tr-ymap-overlay">
          <Stack spacing={1.25} alignItems="center">
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Загружаем карту Яндекса...
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default YandexMap;
