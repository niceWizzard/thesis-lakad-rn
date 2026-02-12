import { distance } from "@turf/turf";

/**
 * Calculates the great-circle distance between two points (lat, lon)
 * @returns {number} - Distance in meters
 */
export function getHaversineDistance(pos1: GeoJSON.Position, pos2: GeoJSON.Position): number {
  return distance(pos1, pos2, { units: 'meters' })
}