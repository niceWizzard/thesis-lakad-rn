import { useQuery } from "@tanstack/react-query"
import { QueryKey } from "../constants/QueryKey"
import { fetchLandmarks } from "../utils/landmark/fetchLandmarks"

export const useQueryLandmarks = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: [QueryKey.VERIFIED_LANDMARKS],
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