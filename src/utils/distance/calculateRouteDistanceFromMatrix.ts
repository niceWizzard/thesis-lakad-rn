import { fetchDistanceMatrix } from "./fetchDistanceMatrix";

/**
 * Calculates the total travel distance of a sequence of landmarks using the 
 * pre-calculated distance matrix.
 * - **Sequential Calculation:** Sums the distance from Landmark A to B, B to C, etc.
 * * 
 * * @param landmarkIds - An ordered array of landmark IDs representing the stops in the itinerary.
 * @returns {Promise<number>} The total travel distance in **meters**.
 * * @example
 * const totalDistance = await calculateRouteDistanceFromMatrix([1, 45, 22]);
 * console.log(`Total: ${totalDistance} meters`);
 * * @throws {Error} If the distance matrix cannot be fetched or contains incomplete data for the sequence.
 */
export const calculateRouteDistanceFromMatrix = async (landmarkIds: number[]) => {

    const distanceMap = await fetchDistanceMatrix(landmarkIds)

    return landmarkIds.reduce((acc, curr, index) => {
        if (index === landmarkIds.length - 1) return acc;
        const nextId = landmarkIds[index + 1]
        return distanceMap[curr][nextId] + acc;
    }, 0)

}