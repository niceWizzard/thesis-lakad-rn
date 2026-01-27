import { supabase } from "../supabase";

export const fetchDistanceMatrix = async (landmarkIds: number[]): Promise<Record<string, Record<string, number>>> => {
    // 1. Fetch distances where both source and destination are in your selected ID list
    const { data, error } = await supabase
        .from("distances")
        .select("source, destination, distance")
        .in("source", landmarkIds)
        .in("destination", landmarkIds);

    if (error) {
        console.error("Error fetching distance matrix:", error);
        throw error;
    }

    if (!data || !data.length)
        throw new Error("No distance data found. Please contact administrator.");

    // 2. Transform the flat array into a Record<string, Record<string, number>>
    const matrix: Record<string, Record<string, number>> = {};

    // Initialize the matrix with empty objects for each ID to ensure every node exists
    landmarkIds.forEach(id => {
        matrix[id.toString()] = {};
    });

    // 3. Populate the matrix with actual data
    data.forEach((row) => {
        const src = row.source.toString();
        const dest = row.destination.toString();
        matrix[src][dest] = row.distance;
    });

    return matrix;
};