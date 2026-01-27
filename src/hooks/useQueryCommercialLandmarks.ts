import { useQuery } from "@tanstack/react-query"
import { fetchCommercialLandmarks } from "../utils/landmark/fetchCommercial"

export const useQueryCommercialLandmarks = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: ['commercial-landmarks'],
        queryFn: fetchCommercialLandmarks,
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