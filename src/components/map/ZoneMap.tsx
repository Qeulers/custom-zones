import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Coordinate } from '../../types/zone';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface ZoneMapProps {
  mode: 'circular' | 'polygon' | 'view';
  // Circular zone props
  circleCenter?: Coordinate | null;
  circleRadius?: number;
  onCircleCenterChange?: (center: Coordinate) => void;
  onCircleRadiusChange?: (radius: number) => void;
  // Polygon zone props
  polygonCoordinates?: Coordinate[];
  onPolygonCoordinatesChange?: (coordinates: Coordinate[]) => void;
  // Common props
  isDrawing?: boolean;
  className?: string;
}

// Component to handle map clicks for circular zone
function CircularZoneHandler({
  isDrawing,
  circleCenter,
  onCircleCenterChange,
  onCircleRadiusChange,
}: {
  isDrawing: boolean;
  circleCenter: Coordinate | null;
  onCircleCenterChange: (center: Coordinate) => void;
  onCircleRadiusChange: (radius: number) => void;
}) {
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);
  const map = useMap();

  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      
      if (!circleCenter) {
        // First click sets the center
        onCircleCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
    mousedown() {
      if (!isDrawing || !circleCenter) return;
      setIsDraggingRadius(true);
      map.dragging.disable();
    },
    mousemove(e) {
      if (!isDraggingRadius || !circleCenter) return;
      
      const center = L.latLng(circleCenter.lat, circleCenter.lng);
      const radius = center.distanceTo(e.latlng);
      onCircleRadiusChange(Math.round(radius));
    },
    mouseup() {
      if (isDraggingRadius) {
        setIsDraggingRadius(false);
        map.dragging.enable();
      }
    },
  });

  return null;
}

// Component to handle map clicks for polygon zone
function PolygonZoneHandler({
  isDrawing,
  coordinates,
  onCoordinatesChange,
}: {
  isDrawing: boolean;
  coordinates: Coordinate[];
  onCoordinatesChange: (coordinates: Coordinate[]) => void;
}) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      
      const newCoord: Coordinate = { lat: e.latlng.lat, lng: e.latlng.lng };
      onCoordinatesChange([...coordinates, newCoord]);
    },
  });

  return null;
}

// Component to fit map bounds to zone
function FitBounds({ coordinates }: { coordinates: Coordinate[] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);

  return null;
}

export function ZoneMap({
  mode,
  circleCenter,
  circleRadius = 1000,
  onCircleCenterChange,
  onCircleRadiusChange,
  polygonCoordinates = [],
  onPolygonCoordinatesChange,
  isDrawing = false,
  className = '',
}: ZoneMapProps) {
  const defaultCenter: [number, number] = [51.505, -0.09]; // London
  const defaultZoom = 4;

  // Determine map center based on mode and data
  const getMapCenter = (): [number, number] => {
    if (mode === 'circular' && circleCenter) {
      return [circleCenter.lat, circleCenter.lng];
    }
    if (mode === 'polygon' && polygonCoordinates.length > 0) {
      const avgLat = polygonCoordinates.reduce((sum, c) => sum + c.lat, 0) / polygonCoordinates.length;
      const avgLng = polygonCoordinates.reduce((sum, c) => sum + c.lng, 0) / polygonCoordinates.length;
      return [avgLat, avgLng];
    }
    return defaultCenter;
  };

  return (
    <div className={`relative ${className}`} style={{ height: '100%', minHeight: '400px' }}>
      <MapContainer
        center={getMapCenter()}
        zoom={defaultZoom}
        className="h-full w-full rounded-lg"
        style={{ height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Circular Zone */}
        {mode === 'circular' && (
          <>
            {onCircleCenterChange && onCircleRadiusChange && (
              <CircularZoneHandler
                isDrawing={isDrawing}
                circleCenter={circleCenter || null}
                onCircleCenterChange={onCircleCenterChange}
                onCircleRadiusChange={onCircleRadiusChange}
              />
            )}
            {circleCenter && (
              <>
                <Circle
                  center={[circleCenter.lat, circleCenter.lng]}
                  radius={circleRadius}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
                <Marker position={[circleCenter.lat, circleCenter.lng]} />
              </>
            )}
          </>
        )}

        {/* Polygon Zone */}
        {mode === 'polygon' && (
          <>
            {onPolygonCoordinatesChange && (
              <PolygonZoneHandler
                isDrawing={isDrawing}
                coordinates={polygonCoordinates}
                onCoordinatesChange={onPolygonCoordinatesChange}
              />
            )}
            {polygonCoordinates.length > 0 && (
              <>
                {/* Draw polygon if we have at least 3 points */}
                {polygonCoordinates.length >= 3 && (
                  <Polygon
                    positions={polygonCoordinates.map(c => [c.lat, c.lng])}
                    pathOptions={{
                      color: '#2563eb',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                  />
                )}
                {/* Draw markers for each vertex */}
                {polygonCoordinates.map((coord, index) => (
                  <Marker
                    key={index}
                    position={[coord.lat, coord.lng]}
                  />
                ))}
              </>
            )}
            {polygonCoordinates.length > 0 && (
              <FitBounds coordinates={polygonCoordinates} />
            )}
          </>
        )}
      </MapContainer>

      {/* Drawing instructions overlay */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg">
          {mode === 'circular' && !circleCenter && (
            <p className="text-sm text-gray-700">Click on the map to set the center point</p>
          )}
          {mode === 'circular' && circleCenter && (
            <p className="text-sm text-gray-700">Click and drag to set the radius</p>
          )}
          {mode === 'polygon' && (
            <p className="text-sm text-gray-700">
              Click on the map to add vertices ({polygonCoordinates.length} points added)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
