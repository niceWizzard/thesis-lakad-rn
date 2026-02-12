import { useQuery } from "@tanstack/react-query"
import { fetchPasalubongCenters } from "../utils/landmark/fetchPasalubongCenters"

export const useQueryPasalubongCenters = () => {
    const {
        data,
        isLoading,
        error,
        refetch,
        ...rest
    } = useQuery({
        queryKey: ['pasalubong-centers'],
        queryFn: fetchPasalubongCenters,
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