import { fetchDistanceMatrix } from "./fetchDistanceMatrix";

export const calculateRouteDistanceFromMatrix = async (landmarkIds: number[]) => {

    const distanceMap = await fetchDistanceMatrix(landmarkIds)

    return landmarkIds.reduce((acc, curr, index) => {
        if (index === landmarkIds.length - 1) return acc;
        const nextId = landmarkIds[index + 1]
        return distanceMap[curr][nextId] + acc;
    }, 0)

}