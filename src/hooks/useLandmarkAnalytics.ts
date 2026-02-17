import { supabase } from "@/src/utils/supabase";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

export interface LandmarkAnalyticsData {
    totalVisits: number;
    distinctItineraries: number;
    monthlyVisits: { month: string; count: number }[];
}

export const useLandmarkAnalytics = (landmarkId: string): UseQueryResult<LandmarkAnalyticsData, Error> => {
    return useQuery({
        queryKey: ["landmark-analytics", landmarkId],
        queryFn: async (): Promise<LandmarkAnalyticsData> => {
            if (!landmarkId) throw new Error("Landmark ID is required");

            const id = parseInt(landmarkId);
            if (isNaN(id)) throw new Error("Invalid Landmark ID");

            // 1. Total Visits (Count of stops)
            const { count: totalVisits, error: visitsError } = await supabase
                .from("stops")
                .select("*", { count: "exact", head: true })
                .eq("landmark_id", id);

            if (visitsError) throw visitsError;

            // 2. Distinct Itineraries
            const { data: stops, error: stopsError } = await supabase
                .from("stops")
                .select("itinerary_id, created_at")
                .eq("landmark_id", id);

            if (stopsError) throw stopsError;

            const distinctItineraries = new Set(stops?.map(s => s.itinerary_id)).size;

            // 3. Monthly Visits (Last 6 months)
            const monthlyCounts: Record<string, number> = {};
            const now = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 5); // Go back 5 months + current month = 6

            // Initialize last 6 months with 0
            for (let i = 0; i < 6; i++) {
                const d = new Date(sixMonthsAgo);
                d.setMonth(d.getMonth() + i);
                const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g., "Jan 24"
                monthlyCounts[monthYear] = 0;
            }

            stops?.forEach(stop => {
                const date = new Date(stop.created_at);
                if (date >= sixMonthsAgo) {
                    const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                    if (monthlyCounts[monthYear] !== undefined) {
                        monthlyCounts[monthYear]++;
                    }
                }
            });

            const monthlyVisits = Object.entries(monthlyCounts).map(([month, count]) => ({
                month,
                count
            }));

            return {
                totalVisits: totalVisits || 0,
                distinctItineraries: distinctItineraries || 0,
                monthlyVisits
            };
        },
        enabled: !!landmarkId,
    });
};
