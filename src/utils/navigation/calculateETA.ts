/**
 * Calculate Estimated Time of Arrival based on route duration
 * @param durationInSeconds - Duration of the route in seconds
 * @returns Formatted ETA string (e.g., "Arrive at 3:45 PM")
 */
export function calculateETA(durationInSeconds: number): string {
    const now = new Date();
    const eta = new Date(now.getTime() + durationInSeconds * 1000);

    const hours = eta.getHours();
    const minutes = eta.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `Arrive at ${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Get just the time portion for display
 * @param durationInSeconds - Duration of the route in seconds
 * @returns Time string (e.g., "3:45 PM")
 */
export function getETATime(durationInSeconds: number): string {
    const now = new Date();
    const eta = new Date(now.getTime() + durationInSeconds * 1000);

    const hours = eta.getHours();
    const minutes = eta.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes} ${ampm}`;
}
