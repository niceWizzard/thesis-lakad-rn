import { ORS_BASE_URL } from "@/src/constants/url";
import { ACCESS_TOKEN } from "../../constants/token";

/**
 * Calculates a complete $N \times N$ distance matrix for an array of waypoints.
 * * **Features:**
 * - **Auto-Chunking:** Automatically handles OpenRouteService (ORS) API limits (50 locations per request) 
 * by splitting large datasets into a tiled grid of sub-matrix requests.
 * - **Progress Tracking:** Provides an optional callback to monitor the status of chunked fetches.
 * - **Memory Efficient:** Returns a nested Record object mapped by your custom waypoint IDs.
 * * **ORS Constraints Handled:**
 * - Maximum 50 locations per individual request.
 * - Maximum 3,500 routes per individual request (50x50 = 2,500, which is safe).
 * * @param params - The calculation parameters.
 * @param params.waypointsWithIds - Array of objects containing unique `id` and `coords` [longitude, latitude].
 * @param params.profile - The routing profile to use (e.g., 'driving-car', 'foot-walking', 'cycling-road').
 * @param params.onFetchProgress - Callback function receiving `(completedChunks, totalChunks)`.
 * * @returns A promise resolving to a nested object: `{ [sourceId]: { [destinationId]: distanceInMeters } }`.
 * @throws {Error} If the API returns an error or the network request fails.
 */
export const calculateDistanceMatrix = async ({
    waypointsWithIds,
    profile = 'driving-car',
    onFetchProgress,
}: {
    waypointsWithIds: { id: string, coords: [number, number] }[],
    profile?: 'driving-car' | 'foot-walking' | 'cycling-road',
    onFetchProgress?: (current: number, total: number) => void,
}): Promise<Record<string, Record<string, number>>> => {

    const n = waypointsWithIds.length;
    const fullMatrix: Record<string, Record<string, number>> = {};
    waypointsWithIds.forEach(wp => fullMatrix[wp.id] = {});

    const ORS_LIMIT = 50;
    const url = `${ORS_BASE_URL}/v2/matrix/${profile}`;

    // --- CASE 1: Simple Request (N <= 50) ---
    if (n <= ORS_LIMIT) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ACCESS_TOKEN,
            },
            body: JSON.stringify({
                locations: waypointsWithIds.map(v => v.coords),
                metrics: ["distance"]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(`ORS Error: ${JSON.stringify(data.error)}`);

        data.distances.forEach((row: number[], sIdx: number) => {
            const sourceId = waypointsWithIds[sIdx].id;
            row.forEach((distance, dIdx) => {
                const destId = waypointsWithIds[dIdx].id;
                if (distance == null)
                    throw new Error(`Invalid location at index ${sourceId} to ${destId}`)
                fullMatrix[sourceId][destId] = distance;
            });
        });

        onFetchProgress?.(1, 1);
        return fullMatrix;
    }

    // --- CASE 2: Chunked Request (N > 50) ---
    // We split into tiled chunks. To fill an N x N matrix, we iterate through 
    // source chunks (rows) and destination chunks (columns).

    const CHUNK_SIZE = 50;
    const totalChunks = Math.ceil(n / CHUNK_SIZE);
    const totalRequests = totalChunks * totalChunks;
    let completedRequests = 0;

    for (let i = 0; i < n; i += CHUNK_SIZE) {
        for (let j = 0; j < n; j += CHUNK_SIZE) {
            const sourcesSlice = waypointsWithIds.slice(i, i + CHUNK_SIZE);
            const destsSlice = waypointsWithIds.slice(j, j + CHUNK_SIZE);

            // currentLocations contains all sources followed by all destinations
            const currentLocations = [...sourcesSlice.map(s => s.coords), ...destsSlice.map(d => d.coords)];
            const sourceIndices = sourcesSlice.map((_, idx) => idx);
            const destIndices = destsSlice.map((_, idx) => idx + sourcesSlice.length);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    locations: currentLocations,
                    sources: sourceIndices,
                    destinations: destIndices,
                    metrics: ["distance"]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(`ORS Chunk Error: ${JSON.stringify(data.error)}`);

            data.distances.forEach((row: (number | null)[], sIdx: number) => {
                const sourceId = sourcesSlice[sIdx].id;
                row.forEach((distance, dIdx) => {
                    const destId = destsSlice[dIdx].id;
                    if (distance == null)
                        throw new Error(`Invalid location at index ${sourceId} to ${destId}`)
                    fullMatrix[sourceId][destId] = distance;
                });
            });

            completedRequests++;
            onFetchProgress?.(completedRequests, totalRequests);
        }
    }

    return fullMatrix;
};