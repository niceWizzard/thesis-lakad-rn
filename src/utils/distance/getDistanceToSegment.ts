import { getHaversineDistance } from '@/src/utils/distance/getHaversineDistance';

/**
 * Calculates the shortest distance (in kilometers) from a point `p` to a line segment defined by points `a` and `b`.
 *
 * This function handles the projection of point `p` onto the line segment `ab`.
 * If the projection falls outside the segment, it returns the distance to the closest endpoint.
 *
 * @param p - The point to measure distance from [longitude, latitude].
 * @param a - The start point of the line segment [longitude, latitude].
 * @param b - The end point of the line segment [longitude, latitude].
 * @returns The distance in kilometers.
 */
export const getDistanceToSegment = (
    p: [number, number],
    a: [number, number],
    b: [number, number]
): number => {
    // Helper to calculate cross-track distance using projection
    const crossTrackDistance = (point: [number, number], start: [number, number], end: [number, number]) => {
        // Standard formula for distance from point to line segment
        // Using Haversine for the "points" but simple projection for the segment parameter t

        const dy = end[1] - start[1];
        const dx = end[0] - start[0];

        // If start and end are the same point
        if (dx === 0 && dy === 0) return getHaversineDistance(point, start);

        // Calculate the projection parameter t
        const t = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy);

        // If projection is outside the segment (before start)
        if (t < 0) return getHaversineDistance(point, start);

        // If projection is outside the segment (after end)
        if (t > 1) return getHaversineDistance(point, end);

        // Calculate the closest point on the segment
        const closestPoint: [number, number] = [start[0] + t * dx, start[1] + t * dy];

        // Return distance to that closest point
        return getHaversineDistance(point, closestPoint);
    };

    return crossTrackDistance(p, a, b);
};
