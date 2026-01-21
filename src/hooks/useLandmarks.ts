import { useQuery } from "@tanstack/react-query"
import { fetchLandmarks } from "../utils/fetchLandmarks"

export const useLandmarks = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: ['landmarks'],
        queryFn: fetchLandmarks,
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