import { useQuery } from "@tanstack/react-query"
import { fetchLandmarks } from "../utils/landmark/fetchLandmarks"

export const useQueryUnverifiedPlaces = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: ['pasalubong-centers'],
        queryFn: () => fetchLandmarks(false),
        initialData: [],
    })

    return {
        landmarks: data,
        isLoading,
        error,
        refetch,
        ...rest
    }
}