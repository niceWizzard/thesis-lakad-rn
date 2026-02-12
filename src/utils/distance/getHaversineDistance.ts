/**
 * Calculates the great-circle distance between two points (lat, lon)
 * @returns {number} - Distance in meters
 */
export function getHaversineDistance(pos1: GeoJSON.Position, pos2: GeoJSON.Position): number {
  const R = 6371e3; // Earth's radius in METERS (6,371,000m)

  const [lon1, lat1] = pos1;
  const [lon2, lat2] = pos2;

  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Result is now accurately in meters
}