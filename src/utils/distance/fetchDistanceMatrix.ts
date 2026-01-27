import { supabase } from "../supabase";

export const fetchDistanceMatrix = async (landmarkIds: number[]): Promise<Record<string, Record<string, number>>> => {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from("distances")
            .select("source, destination, distance")
            .in("source", landmarkIds)
            .in("destination", landmarkIds)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            page++;
        } else {
            hasMore = false;
        }

        // Safety break to prevent infinite loops during dev
        if (page > 25) break;
    }

    const matrix: Record<string, Record<string, number>> = {};
    landmarkIds.forEach(id => { matrix[id.toString()] = {}; });

    allData.forEach((row) => {
        matrix[row.source.toString()][row.destination.toString()] = row.distance;
    });

    return matrix;
};