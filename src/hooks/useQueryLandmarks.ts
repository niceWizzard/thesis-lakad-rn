import { useQuery } from "@tanstack/react-query"
import { fetchLandmarks } from "../utils/landmark/fetchLandmarks"

export const useQueryLandmarks = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: ['landmarks'],
        queryFn: () => fetchLandmarks(true),
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