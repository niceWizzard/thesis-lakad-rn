import AlgorithmModule from "@/modules/algorithm-module/src/AlgorithmModule";

export const optimizeItinerary = async ({
    distanceMap,
    itineraryDistance,
}: {
    distanceMap: Record<string, Record<string, number>>,
    itineraryDistance: number,
}) => {
    let optimizedIds: string[] = [];
    let distance = 0;
    let bestDistance = Number.MAX_VALUE;
    for (let i = 0; i < 15; i++) {
        const {
            itinerary: optimizedItinerary,
            distance: algoDistance
        } = await AlgorithmModule.calculateOptimizedItinerary(distanceMap);

        bestDistance = Math.min(bestDistance, algoDistance);

        // prevents false improvement due to rounding errors
        if (algoDistance < itineraryDistance - 0.1 || !itineraryDistance) {
            optimizedIds = optimizedItinerary;
            distance = algoDistance;
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