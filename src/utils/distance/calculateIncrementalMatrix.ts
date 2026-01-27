import { ACCESS_TOKEN } from "../../constants/token";

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
    // By using 1 source (new) vs 49 destinations (existing), we only 
    // calculate 49 routes per call. Very safe.
    const CHUNK_SIZE = 49;

    for (let i = 0; i < existingWaypoints.length; i += CHUNK_SIZE) {
        const chunk = existingWaypoints.slice(i, i + CHUNK_SIZE);
        const locations = [newWaypoint.coords, ...chunk.map(wp => wp.coords)];

        // Indices: 0 is New. 1 to Chunk.length are Existing.
        const chunkIndices = chunk.map((_, idx) => idx + 1);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ACCESS_TOKEN,
            },
            body: JSON.stringify({
                locations,
                // Requesting ONLY the cross-section: 
                // New -> All in Chunk AND All in Chunk -> New
                sources: [0, ...chunkIndices],
                destinations: [0, ...chunkIndices],
                metrics: ["distance"]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(`ORS Error: ${data.error.message}`);

        // Extract Row (Outbound: New -> Existing)
        // data.distances[0] is the row for source index 0
        data.distances[0].forEach((dist: number, dIdx: number) => {
            if (dIdx === 0) return; // skip self-to-self
            const destId = chunk[dIdx - 1].id;
            outbound[destId] = dist;
        });

        // Extract Column (Inbound: Existing -> New)
        // data.distances[1...N][0] are the values for destination index 0
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