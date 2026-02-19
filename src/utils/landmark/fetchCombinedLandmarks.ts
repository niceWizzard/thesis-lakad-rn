import { Landmark } from "@/src/model/landmark.types";
import { supabase } from "../supabase";
import { fetchPasalubongCenters } from "./fetchPasalubongCenters";

/**
 * Fetches both active tourist attractions and pasalubong centers from the database.
 * * **Combined Logic:**
 * - Fetches `TOURIST_ATTRACTION` from `landmark` table.
 * - Fetches all from `pasalubong_centers` table.
 * * @returns {Promise<Landmark[]>} A promise resolving to a combined array of active landmarks, 
 * sorted by most recently created.
 * @throws {PostgrestError} If the Supabase query fails.
 */
export const fetchCombinedLandmarks = async (): Promise<Landmark[]> => {
    const { data: touristLandmarks, error: touristError } = await supabase
        .from('landmark')
        .select('*, landmark_opening_hours(*)')
        .eq('creation_type', "TOURIST_ATTRACTION")
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    if (touristError) {
        throw touristError;
    }
    const pasalubongCenters = await fetchPasalubongCenters();

    // Combine and sort
    const combined = [...(touristLandmarks || []), ...pasalubongCenters];

    // Sort by created_at descending
    combined.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return combined;
}
