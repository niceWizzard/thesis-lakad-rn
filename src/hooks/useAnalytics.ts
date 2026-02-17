import { supabase } from "@/src/utils/supabase";
import { useQuery } from "@tanstack/react-query";

export interface AnalyticsData {
    totalItineraries: number;
    activeLandmarks: number;
    archivedLandmarks: number;
    totalDistance: number;
    topLandmarks: { id: string; name: string; count: number }[];
    lowestLandmarks: { id: string; name: string; count: number }[];
    categoryDistribution: { type: string; count: number }[];
}

export const useAnalytics = () => {
    return useQuery({
        queryKey: ["admin-analytics"],
        queryFn: async (): Promise<AnalyticsData> => {
            // 1. Fetch Counts
            const itinerariesCount = await supabase
                .from("itinerary")
                .select("*", { count: "exact", head: true });

            const activeLandmarksCount = await supabase
                .from("landmark")
                .select("*", { count: "exact", head: true })
                .eq("creation_type", "TOURIST_ATTRACTION")
                .is("deleted_at", null);

            const archivedLandmarksCount = await supabase
                .from("landmark")
                .select("*", { count: "exact", head: true })
                .eq("creation_type", "TOURIST_ATTRACTION")
                .not("deleted_at", "is", null);

            // 2. Fetch Total Distance (sum of all itinerary distances)
            // fetching all might be heavy, but for now we do it. 
            // Ideally this should be an RPC or a lightweight query.
            const { data: itineraryDistances } = await supabase
                .from("itinerary")
                .select("distance");

            const totalDistance = itineraryDistances?.reduce((sum, item) => sum + (item.distance || 0), 0) || 0;


            // 3. Fetch Top Landmarks
            // We fetch all stops to count occurrences. Scaling concern: YES.
            // Optimization: Create a view or RPC in the future.
            const { data: stops } = await supabase
                .from("stops")
                .select("landmark_id, landmark(name)");

            const landmarkCounts: Record<string, number> = {};
            const landmarkNames: Record<string, string> = {};

            stops?.forEach((stop: any) => {
                if (stop.landmark_id && stop.landmark?.name) {
                    landmarkCounts[stop.landmark_id] = (landmarkCounts[stop.landmark_id] || 0) + 1;
                    landmarkNames[stop.landmark_id] = stop.landmark.name;
                }
            });

            const topLandmarks = Object.entries(landmarkCounts)
                .map(([id, count]) => ({ id, name: landmarkNames[id], count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);


            // 4. Fetch Category Distribution
            const { data: landmarks } = await supabase
                .from("landmark")
                .select("id, name, type")
                .eq("creation_type", "TOURIST_ATTRACTION");

            const categoryCounts: Record<string, number> = {};
            landmarks?.forEach((l) => {
                const type = l.type || "Uncategorized";
                categoryCounts[type] = (categoryCounts[type] || 0) + 1;
            });

            const categoryDistribution = Object.entries(categoryCounts)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);

            const lowestLandmarks = (landmarks || [])
                .map((l: any) => ({ id: l.id, name: l.name, count: landmarkCounts[l.id] || 0 }))
                .sort((a: any, b: any) => a.count - b.count)
                .slice(0, 5);


            return {
                totalItineraries: itinerariesCount.count || 0,
                activeLandmarks: activeLandmarksCount.count || 0,
                archivedLandmarks: archivedLandmarksCount.count || 0,
                totalDistance,
                topLandmarks,
                lowestLandmarks,
                categoryDistribution,
            };
        },
    });
};
