import { useQueryUnverifiedPlaces } from '@/src/hooks/useQueryUnverified';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Hook to manage itinerary data fetching and derived state.
 * 
 * @param id - The ID of the itinerary to fetch.
 * @returns An object containing the itinerary, specific stops (next, completed, pending), and loading state.
 */
export const useItineraryData = (id: string | number) => {
    const { session } = useAuthStore();
    const userId = session?.user.id;
    const parsedId = Number(id);

    const { data: itinerary, isLoading, refetch } = useQuery({
        queryKey: ['itinerary', id],
        enabled: !!userId && !!id && !isNaN(parsedId),
        queryFn: async () => fetchItineraryById(userId!, parsedId)
    });

    const { landmarks: pasalubongs } = useQueryUnverifiedPlaces();

    const nextUnvisitedStop = useMemo(() => {
        if (!itinerary) return null;
        return itinerary.stops.find(stop => !stop.visited_at) || null;
    }, [itinerary]);

    const completedStops = useMemo(() => {
        if (!itinerary) return [];
        return itinerary.stops.filter(stop => !!stop.visited_at);
    }, [itinerary]);

    const pendingStops = useMemo(() => {
        if (!itinerary) return [];
        return itinerary.stops.filter(stop => !stop.visited_at);
    }, [itinerary]);

    return {
        itinerary,
        isLoading,
        refetch,
        pasalubongs,
        nextUnvisitedStop,
        completedStops,
        pendingStops
    };
};
