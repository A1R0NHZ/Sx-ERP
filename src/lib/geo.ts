/**
 * Haversine formula — returns distance in meters between two lat/lng points.
 */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const GEO_RADIUS_METERS = 100;
export const MIN_DURATION_MINUTES = 45;

export function isWithinRadius(
  userLat: number,
  userLon: number,
  locations: { latitude: number; longitude: number }[]
): boolean {
  return locations.some(
    (loc) =>
      getDistanceMeters(userLat, userLon, loc.latitude, loc.longitude) <=
      GEO_RADIUS_METERS
  );
}
