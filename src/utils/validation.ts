import * as turf from '@turf/turf';
import { Coordinate, ValidationResult, GeoJSONFeatureCollection, GeoJSONPolygon } from '../types/zone';

const MIN_VERTICES = 3;
const MIN_POINT_DISTANCE_METERS = 25;

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const from = turf.point([coord1.lng, coord1.lat]);
  const to = turf.point([coord2.lng, coord2.lat]);
  return turf.distance(from, to, { units: 'meters' });
}

/**
 * Check if polygon has at least minimum number of vertices
 */
export function hasMinimumVertices(coordinates: Coordinate[]): boolean {
  return coordinates.length >= MIN_VERTICES;
}

/**
 * Check if polygon is closed (first and last points are the same or very close)
 */
export function isPolygonClosed(coordinates: Coordinate[]): boolean {
  if (coordinates.length < MIN_VERTICES) return false;
  
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  
  // Check if first and last are the same point (within 1 meter tolerance)
  return calculateDistance(first, last) < 1;
}

/**
 * Check if all consecutive points are at least MIN_POINT_DISTANCE_METERS apart
 */
export function hasMinimumPointDistance(coordinates: Coordinate[]): { valid: boolean; invalidPairs: [number, number][] } {
  const invalidPairs: [number, number][] = [];
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const distance = calculateDistance(coordinates[i], coordinates[i + 1]);
    if (distance < MIN_POINT_DISTANCE_METERS) {
      invalidPairs.push([i, i + 1]);
    }
  }
  
  return {
    valid: invalidPairs.length === 0,
    invalidPairs,
  };
}

/**
 * Check if polygon has self-intersections
 */
export function hasSelfIntersections(coordinates: Coordinate[]): boolean {
  if (coordinates.length < 4) return false;
  
  // Create a closed polygon for turf
  const closedCoords = [...coordinates];
  if (!isPolygonClosed(coordinates)) {
    closedCoords.push(coordinates[0]);
  }
  
  const turfCoords = closedCoords.map(c => [c.lng, c.lat]);
  
  try {
    const polygon = turf.polygon([turfCoords]);
    const kinked = turf.kinks(polygon);
    return kinked.features.length > 0;
  } catch {
    return true; // If we can't create a valid polygon, assume it's invalid
  }
}

/**
 * Check if polygon has holes (we don't support holes)
 */
export function hasHoles(geoJSON: GeoJSONFeatureCollection): boolean {
  if (!geoJSON.features || geoJSON.features.length === 0) return false;
  
  const feature = geoJSON.features[0];
  if (!feature.geometry || feature.geometry.type !== 'Polygon') return false;
  
  // A polygon with holes has more than one ring in coordinates
  return feature.geometry.coordinates.length > 1;
}

/**
 * Validate a polygon from coordinates
 */
export function validatePolygon(coordinates: Coordinate[]): ValidationResult {
  const errors: string[] = [];
  
  // Check minimum vertices
  if (!hasMinimumVertices(coordinates)) {
    errors.push(`Polygon must have at least ${MIN_VERTICES} vertices. Current: ${coordinates.length}`);
  }
  
  // Check if closed
  if (coordinates.length >= MIN_VERTICES && !isPolygonClosed(coordinates)) {
    errors.push('Polygon must be closed (first and last points must be the same)');
  }
  
  // Check minimum point distance
  const distanceCheck = hasMinimumPointDistance(coordinates);
  if (!distanceCheck.valid) {
    const pairDescriptions = distanceCheck.invalidPairs.map(
      ([i, j]) => `points ${i + 1} and ${j + 1}`
    ).join(', ');
    errors.push(`Points must be at least ${MIN_POINT_DISTANCE_METERS} meters apart. Too close: ${pairDescriptions}`);
  }
  
  // Check for self-intersections
  if (coordinates.length >= 4 && hasSelfIntersections(coordinates)) {
    errors.push('Polygon must not have self-intersections');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a GeoJSON FeatureCollection
 */
export function validateGeoJSON(geoJSON: unknown): ValidationResult {
  const errors: string[] = [];
  
  // Check basic structure
  if (!geoJSON || typeof geoJSON !== 'object') {
    return { isValid: false, errors: ['Invalid GeoJSON: must be an object'] };
  }
  
  const fc = geoJSON as GeoJSONFeatureCollection;
  
  if (fc.type !== 'FeatureCollection') {
    errors.push('GeoJSON must be a FeatureCollection');
  }
  
  if (!fc.features || !Array.isArray(fc.features)) {
    errors.push('GeoJSON must have a features array');
    return { isValid: false, errors };
  }
  
  if (fc.features.length === 0) {
    errors.push('GeoJSON must have at least one feature');
    return { isValid: false, errors };
  }
  
  if (fc.features.length > 1) {
    errors.push('GeoJSON must have exactly one polygon feature');
    return { isValid: false, errors };
  }
  
  const feature = fc.features[0];
  
  if (!feature.geometry) {
    errors.push('Feature must have a geometry');
    return { isValid: false, errors };
  }
  
  if (feature.geometry.type !== 'Polygon') {
    errors.push(`Geometry must be a Polygon, got: ${feature.geometry.type}`);
    return { isValid: false, errors };
  }
  
  // Check for holes
  if (hasHoles(fc)) {
    errors.push('Polygon with holes is not supported');
  }
  
  // Convert to coordinates and validate
  const coordinates = geoJSONToCoordinates(feature.geometry);
  const polygonValidation = validatePolygon(coordinates);
  
  return {
    isValid: errors.length === 0 && polygonValidation.isValid,
    errors: [...errors, ...polygonValidation.errors],
  };
}

/**
 * Convert GeoJSON polygon coordinates to our Coordinate format
 */
export function geoJSONToCoordinates(geometry: GeoJSONPolygon): Coordinate[] {
  if (!geometry.coordinates || !geometry.coordinates[0]) {
    return [];
  }
  
  // GeoJSON uses [lng, lat] format
  return geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
}

/**
 * Convert our Coordinate format to GeoJSON polygon
 */
export function coordinatesToGeoJSON(coordinates: Coordinate[]): GeoJSONFeatureCollection {
  // Ensure polygon is closed
  const closedCoords = [...coordinates];
  if (coordinates.length > 0 && !isPolygonClosed(coordinates)) {
    closedCoords.push(coordinates[0]);
  }
  
  // Convert to GeoJSON format [lng, lat]
  const geoJSONCoords = closedCoords.map(c => [c.lng, c.lat]);
  
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [geoJSONCoords],
        },
      },
    ],
  };
}

/**
 * Parse and validate a GeoJSON string
 */
export function parseGeoJSONString(jsonString: string): { geoJSON: GeoJSONFeatureCollection | null; error: string | null } {
  try {
    const parsed = JSON.parse(jsonString);
    return { geoJSON: parsed as GeoJSONFeatureCollection, error: null };
  } catch (e) {
    return { geoJSON: null, error: 'Invalid JSON format' };
  }
}

/**
 * Validate circular zone parameters
 */
export function validateCircularZone(lat: number, lng: number, radius: number): ValidationResult {
  const errors: string[] = [];
  
  if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (lng < -180 || lng > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  if (radius <= 0) {
    errors.push('Radius must be greater than 0');
  }
  
  if (radius > 1000000) { // 1000 km max
    errors.push('Radius must be less than 1,000,000 meters (1000 km)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
