export type ZoneType = 'POLYGON' | 'CIRCULAR';
export type PolygonFormat = 'GEOJSON' | 'WKT';

export interface Centroid {
  longitude: number;
  latitude: number;
}

export interface CircleDetails {
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface PolygonDetails {
  format: PolygonFormat;
  polygon: string; // GeoJSON or WKT string
}

export interface CustomZone {
  id: string;
  name: string;
  description?: string;
  type: 'Custom';
  sub_type: ZoneType;
  custom_type: ZoneType;
  centroid: Centroid;
  circle_details: CircleDetails | null;
  polygon_details: PolygonDetails | null;
  created_by: string;
  created_at: string;
  last_modified_by: string;
  last_modified_at: string;
}

export interface CreateZoneRequest {
  name: string;
  description?: string;
  custom_type: ZoneType;
  circle_details?: CircleDetails;
  polygon_details?: PolygonDetails;
}

export interface UpdateZoneRequest extends CreateZoneRequest {
  id: string;
}

export interface ZoneSearchParams {
  limit?: number;
  offset?: number;
  name_contains?: string;
  types?: string;
  sub_type?: string;
  country_code?: string;
}

export interface ZoneSearchResult {
  id: string;
  name: string;
  description: string;
  type: string;
  sub_type: string;
  centroid: Centroid;
  country_code?: string;
  country_common_name?: string;
  unlocode?: string;
  wpi_number?: number | null;
  custom_zone_details?: {
    custom_type: ZoneType;
    circle_details: CircleDetails | null;
    polygon_details: PolygonDetails | null;
  } | null;
}

export interface ZoneListResponse {
  meta: {
    limit: number;
    offset: number;
    total_count: number;
    request_id: string;
    request_timestamp: string;
    zone_version: string;
  };
  data: ZoneSearchResult[];
}

export interface ZoneSingleResponse {
  meta: {
    request_id: string;
    request_timestamp: string;
    zone_version?: string;
  };
  data: CustomZone;
}

// Coordinate for polygon vertices
export interface Coordinate {
  lat: number;
  lng: number;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// GeoJSON types
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: GeoJSONPolygon;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
