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