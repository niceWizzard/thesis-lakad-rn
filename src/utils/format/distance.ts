/**
 * Formats a distance in meters into a human-readable string using Metric units.
 * * * **Formatting Rules:**
 * - **< 1,000m:** Returns rounded meters (e.g., "450 m").
 * - **1km - 100km:** Returns kilometers with up to 3 decimal places, removing 
 * trailing zeros (e.g., "12.5 km" or "1.234 km").
 * - **> 100km:** Returns kilometers with fixed 2-decimal precision (e.g., "150.25 km").
 * * 

 * * @param meters - The raw distance value in meters.
 * @returns {string} A formatted string representing the distance (e.g., "1.5 km", "500 m").
 * * @example
 * formatDistance(500);    // "500 m"
 * formatDistance(1500);   // "1.5 km"
 * formatDistance(125400); // "125.40 km"
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }

    const km = meters / 1000;

    if (km < 100) {
        // Standard precision for local trips
        return `${km.toFixed(3)} km`;
    } else {
        // High-level overview for long trips
        return `${km.toFixed(2)} km`;
    }
}