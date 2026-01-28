/**
 * Format duration in seconds to human-readable format
 * @param durationInSeconds - Duration in seconds
 * @returns Formatted duration string (e.g., "15 min", "1h 30min", "2h 5min")
 */
export function formatDuration(durationInSeconds: number): string {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);

    if (hours > 0) {
        if (minutes > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${hours}h`;
    }

    return `${minutes} min`;
}

/**
 * Format duration in seconds to short format
 * @param durationInSeconds - Duration in seconds
 * @returns Short formatted duration (e.g., "15m", "1h 30m")
 */
export function formatDurationShort(durationInSeconds: number): string {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);

    if (hours > 0) {
        if (minutes > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${hours}h`;
    }

    return `${minutes}m`;
}
