import { ACCESS_TOKEN } from "../../constants/token";

/**
 * Calculates the travel distances between a newly added waypoint and a collection 
 * of existing waypoints using the OpenRouteService (ORS) Matrix API.
 * * This function performs an **incremental update** by fetching only the "new row" 
 * (outbound) and "new column" (inbound) required to link the point into the graph, 
 * avoiding a full $N \times N$ matrix recalculation.
 * * **Constraints:** * - Handles ORS free tier limit (50 locations/request) by chunking existing points into groups of 49.
 * - Stays under the 3,500 routes-per-request server limit.
 * * @param params - The calculation parameters
 * @param params.newWaypoint - The waypoint being integrated (must include id and [lng, lat])
 * @param params.existingWaypoints - Array of waypoints already stored in the system
 * @param params.profile - Routing profile (e.g., 'driving-car', 'foot-walking')
 * * @returns An object containing the `sourceId` and bidirectional distance maps:
 * - `outbound`: Distance from new point to existing points
 * - `inbound`: Distance from existing points to new point
 * * @throws {Error} If ORS API returns an error or network request fails
 */
export const calculateIncrementalMatrix = async ({
    newWaypoint,
    existingWaypoints,
    profile = 'driving-car',
}: {
    newWaypoint: { id: string, coords: [number, number] },
    existingWaypoints: { id: string, coords: [number, number] }[],
    profile?: 'driving-car' | 'foot-walking' | 'cycling-road',
}) => {
    const url = `https://api.openrouteservice.org/v2/matrix/${profile}`;
    const outbound: Record<string, number> = {};
    const inbound: Record<string, number> = {};

    // ORS free tier allows 50 locations total and 3500 routes per request.
    // We use 1 source (new) vs 49 destinations (existing) per call.
    const CHUNK_SIZE = 49;

    for (let i = 0; i < existingWaypoints.length; i += CHUNK_SIZE) {
        const chunk = existingWaypoints.slice(i, i + CHUNK_SIZE);
        const locations = [newWaypoint.coords, ...chunk.map(wp => wp.coords)];

        // Index 0: New Point | Indices 1..N: Existing Points in current chunk
        const chunkIndices = chunk.map((_, idx) => idx + 1);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ACCESS_TOKEN,
            },
            body: JSON.stringify({
                locations,
                sources: [0, ...chunkIndices],
                destinations: [0, ...chunkIndices],
                metrics: ["distance"]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(`ORS Error: ${data.error.message}`);

        // Extract Row (Outbound: New -> Existing)
        data.distances[0].forEach((dist: number, dIdx: number) => {
            if (dIdx === 0) return; // skip self-to-self
            const destId = chunk[dIdx - 1].id;
            outbound[destId] = dist;
        });

        // Extract Column (Inbound: Existing -> New)
        chunk.forEach((wp, idx) => {
            const rowIndex = idx + 1;
            inbound[wp.id] = data.distances[rowIndex][0];
        });
    }

    return {
        sourceId: newWaypoint.id,
        outbound,
        inbound
    };
};