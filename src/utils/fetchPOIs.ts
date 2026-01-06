import { supabase } from "./supabase"

export const fetchPOIs = async () => {
    const { data: poi, error } = await supabase.from('point_of_interest').select("*")


    if (error) {
        console.log(error)
        return []
    }

    return poi
}