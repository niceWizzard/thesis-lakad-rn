import { Landmark } from "@/src/model/landmark.types";
import { supabase } from "../supabase";

/**
 * Fetches both active tourist attractions and commercial landmarks from the database.
 * * **Filtering Logic:**
 * - `creation_type`: "TOURIST_ATTRACTION" OR "COMMERCIAL".
 * - `deleted_at`: Must be null (excludes archived/soft-deleted items).
 * * @returns {Promise<Landmark[]>} A promise resolving to an array of active landmarks, 
 * sorted by most recently created.
 * @throws {PostgrestError} If the Supabase query fails.
 */
export const fetchCombinedLandmarks = async (): Promise<Landmark[]> => {
    const { data, error } = await supabase
        .from('landmark')
        .select('*')
        .in('creation_type', ["TOURIST_ATTRACTION", "COMMERCIAL"])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}
