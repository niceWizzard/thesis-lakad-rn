import { useQuery } from "@tanstack/react-query"
import { QueryKey } from "../constants/QueryKey"
import { fetchLandmarks } from "../utils/landmark/fetchLandmarks"

export const useQueryUnverifiedPlaces = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: [QueryKey.UNVERIFIED_LANDMARKS],
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