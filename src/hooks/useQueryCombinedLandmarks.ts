import { useQuery } from "@tanstack/react-query"
import { fetchCombinedLandmarks } from "../utils/landmark/fetchCombinedLandmarks"

export const useQueryCombinedLandmarks = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: ['combined-landmarks'],
        queryFn: fetchCombinedLandmarks,
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