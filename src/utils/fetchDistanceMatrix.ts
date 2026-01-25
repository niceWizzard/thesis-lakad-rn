const ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

const BASE_URl = 'https://api.mapbox.com/directions-matrix/v1/mapbox'
const MAX_WAYPOINTS = 25;

/**
 * Fetches a complete distance matrix for any number of points by 
 * breaking them into valid Mapbox API chunks.
 */
export const fetchFullDistanceMatrix = async ({
    waypointsWithIds,
    profile = 'driving',
    onFetchProgress,
}: {
    waypointsWithIds: { id: string, coords: [number, number] }[],
    profile?: 'driving' | 'walking' | 'cycling',
    onFetchProgress?: (current: number, total: number) => void,
}): Promise<Record<string, Record<string, number>>> => {

    const n = waypointsWithIds.length;
    const fullMatrix: Record<string, Record<string, number>> = {};
    waypointsWithIds.forEach(wp => fullMatrix[wp.id] = {});

    // Use a smaller chunk size to stay under the 25 total limit
    // 12 sources + 13 destinations = 25 total waypoints
    const SOURCE_CHUNK_SIZE = 12;
    const DEST_CHUNK_SIZE = 13;

    const totalRequests = Math.ceil(n / SOURCE_CHUNK_SIZE) * Math.ceil(n / DEST_CHUNK_SIZE);
    let completedRequests = 0;

    for (let i = 0; i < n; i += SOURCE_CHUNK_SIZE) {
        const sources = waypointsWithIds.slice(i, i + SOURCE_CHUNK_SIZE);

        for (let j = 0; j < n; j += DEST_CHUNK_SIZE) {
            const destinations = waypointsWithIds.slice(j, j + DEST_CHUNK_SIZE);

            // Combine only these subsets to ensure total <= 25
            const combinedCoords = [...sources, ...destinations]
                .map(v => v.coords.join(','))
                .join(';');

            const sourceIndices = sources.map((_, idx) => idx).join(';');
            const destIndices = destinations.map((_, idx) => idx + sources.length).join(';');

            const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${combinedCoords}?` +
                new URLSearchParams({
                    annotations: 'distance',
                    sources: sourceIndices,
                    destinations: destIndices,
                    access_token: ACCESS_TOKEN
                });

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.code !== "Ok") throw new Error(`Mapbox Error: ${JSON.stringify(data)}`);

                data.distances.forEach((row: number[], sIdx: number) => {
                    const sourceId = sources[sIdx].id;
                    row.forEach((distance, dIdx) => {
                        const destId = destinations[dIdx].id;
                        fullMatrix[sourceId][destId] = distance;
                    });
                });
                completedRequests++;
                onFetchProgress?.(completedRequests, totalRequests);
            } catch (error) {
                console.error("Matrix Sub-request Error:", error);
                throw error;
            }
        }
    }
    return fullMatrix;
};
