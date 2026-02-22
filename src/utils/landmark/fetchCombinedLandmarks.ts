import { Place } from "@/src/model/places.types";
import { supabase } from "../supabase";

/**
 * Fetches both active tourist attractions and pasalubong centers from the database.
 * * **Combined Logic:**
 * - Fetches `TOURIST_ATTRACTION` from `landmark` table.
 * - Fetches all from `pasalubong_centers` table.
 * * @returns {Promise<Place[]>} A promise resolving to a combined array of active landmarks, 
 * sorted by most recently created.
 * @throws {PostgrestError} If the Supabase query fails.
 */
export const fetchCombinedLandmarks = async (): Promise<Place[]> => {
    const { data: touristLandmarks, error: touristError } = await supabase
        .from('places')
        .select('*, opening_hours(*)')
        .eq('creation_type', "TOURIST_ATTRACTION")
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    if (touristError)
        throw touristError;
    if (!touristLandmarks)
        return [];
    return touristLandmarks;
}
