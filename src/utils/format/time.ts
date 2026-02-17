/**
 * Formats a duration in minutes to a string in the format "Xh Ym" or "Ym".
 * @param minutes - The duration in minutes.
 * @returns The formatted duration string.
 */
export function formatDuration(minutes: number): string {
    if (!minutes || minutes < 0) return "";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }

    return `${mins}m`;
}
