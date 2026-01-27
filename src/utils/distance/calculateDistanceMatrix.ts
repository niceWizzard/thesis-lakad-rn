import { ACCESS_TOKEN } from "../../constants/token";

/**
 * Fetches a complete distance matrix for any number of points by 
 * breaking them into valid Mapbox API chunks.
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
    const url = `https://api.openrouteservice.org/v2/matrix/${profile}`;

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
                fullMatrix[sourceId][destId] = distance;
            });
        });

        onFetchProgress?.(1, 1);
        return fullMatrix;
    }

    // --- CASE 2: Chunked Request (N > 50) ---
    // We split into chunks of 50. Note: ORS allows 50x50 in one go, 
    // but the sum of (sources + destinations) must be carefully managed.
    // To be safe and efficient, we use 50 sources and 50 destinations per call.
    const CHUNK_SIZE = 50;
    const totalChunks = Math.ceil(n / CHUNK_SIZE);
    const totalRequests = totalChunks * totalChunks;
    let completedRequests = 0;

    for (let i = 0; i < n; i += CHUNK_SIZE) {
        for (let j = 0; j < n; j += CHUNK_SIZE) {
            const sourcesSlice = waypointsWithIds.slice(i, i + CHUNK_SIZE);
            const destsSlice = waypointsWithIds.slice(j, j + CHUNK_SIZE);

            // For simplicity in chunking, we can just send the relevant points for this sub-matrix
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

            data.distances.forEach((row: number[], sIdx: number) => {
                const sourceId = sourcesSlice[sIdx].id;
                row.forEach((distance, dIdx) => {
                    const destId = destsSlice[dIdx].id;
                    fullMatrix[sourceId][destId] = distance;
                });
            });

            completedRequests++;
            onFetchProgress?.(completedRequests, totalRequests);
        }
    }

    return fullMatrix;
};



