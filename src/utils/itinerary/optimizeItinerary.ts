import AlgorithmModule from "@/modules/algorithm-module/src/AlgorithmModule";

export const optimizeItinerary = async ({
    distanceMap,
    currentRouteIds,
    startNodeId,
}: {
    distanceMap: Record<string, Record<string, number>>,
    currentRouteIds: string[],
    startNodeId?: string,
}) => {
    let initialOpenDistance = 0;
    if (currentRouteIds.length > 0) {
        for (let i = 0; i < currentRouteIds.length - 1; i++) {
            const from = currentRouteIds[i];
            const to = currentRouteIds[i + 1];
            if (distanceMap[from] && distanceMap[from][to] !== undefined) {
                initialOpenDistance += distanceMap[from][to];
            } else {
                initialOpenDistance = Number.MAX_VALUE;
                break;
            }
        }
    }

    const augmentedMap: Record<string, Record<string, number>> = {};
    const nodes = Object.keys(distanceMap);

    for (const node of nodes) {
        augmentedMap[node] = { ...distanceMap[node] };
        augmentedMap[node]["DUMMY"] = 0;
    }

    augmentedMap["DUMMY"] = {};
    for (const node of nodes) {
        if (startNodeId && node !== startNodeId) {
            augmentedMap["DUMMY"][node] = 1000000000;
        } else {
            augmentedMap["DUMMY"][node] = 0;
        }
    }

    const extractOpenPath = (loop: string[]): string[] => {
        const dummyIndex = loop.indexOf("DUMMY");
        if (dummyIndex === -1) return loop;
        return [...loop.slice(dummyIndex + 1), ...loop.slice(0, dummyIndex)];
    }

    const computeOpenDistance = (path: string[]): number => {
        let dist = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            if (distanceMap[from] && distanceMap[from][to] !== undefined) {
                dist += distanceMap[from][to];
            } else {
                return Number.MAX_VALUE;
            }
        }
        return dist;
    };


    let optimizedIds: string[] = [];
    let distance = 0;
    let bestDistance = Number.MAX_VALUE;
    for (let i = 0; i < 15; i++) {
        const {
            itinerary: optimizedItinerary,
        } = await AlgorithmModule.calculateOptimizedItinerary(augmentedMap);

        const openPath = extractOpenPath(optimizedItinerary);
        const openDistance = computeOpenDistance(openPath);

        bestDistance = Math.min(bestDistance, openDistance);

        // prevents false improvement due to rounding errors
        if (openDistance < initialOpenDistance - 0.1 || !initialOpenDistance) {
            optimizedIds = openPath;
            distance = openDistance;
            break;
        }

        if (i === 14) {
            return {
                optimizedIds: [] as string[],
                distance: 0,
                failed: true,
            };
        }
    }
    return {
        optimizedIds,
        distance,
        failed: false
    }
}