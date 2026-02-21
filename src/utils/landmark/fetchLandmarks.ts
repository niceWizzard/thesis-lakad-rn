import { Landmark, LandmarkWithStats } from "@/src/model/landmark.types";
import { supabase } from "../supabase";
/**
 * Fetches all active tourist attractions from the database.
 * * **Filtering Logic:**
 * - `creation_type`: Limited to "TOURIST_ATTRACTION".
 * - `deleted_at`: Must be null (excludes archived/soft-deleted items).
 * * @returns {Promise<Landmark[]>} A promise resolving to an array of active landmarks, 
 * sorted by most recently created.
 * @throws {PostgrestError} If the Supabase query fails.
 */
export const fetchLandmarks = async (): Promise<Landmark[]> => {
    const { data, error } = await supabase
        .from('landmark')
        .select('*')
        .eq('creation_type', "TOURIST_ATTRACTION")
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Fetches all archived or "soft-deleted" tourist attractions.
 * * **Soft Delete Pattern:**
 * Uses the `deleted_at` timestamp to identify landmarks that are hidden 
 * from the main view but preserved in the database.
 * * @returns {Promise<Landmark[]>} A promise resolving to an array of deleted landmarks.
 * @throws {PostgrestError} If the Supabase query fails.
 */
export const fetchArchivedLandmarks = async (): Promise<Landmark[]> => {
    const { data, error } = await supabase
        .from('landmark')
        .select('*')
        .eq('creation_type', "TOURIST_ATTRACTION")
        .not('deleted_at', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}


/**
 * Retrieves a single landmark record by its unique identifier.
 * * **Validation:**
 * Automatically handles string-to-number conversion and validates that the 
 * provided ID is a valid numeric representation.
 * * @param {number | string} id - The unique ID of the landmark.
 * @returns {Promise<any>} A promise resolving to a single landmark object.
 * * @example
 * const landmark = await fetchLandmarkById("42");
 * * @throws {Error} If the ID is non-numeric.
 * @throws {PostgrestError} If the record is not found or the query fails.
 */
export const fetchLandmarkById = async (id: number | string) => {
    if (typeof id === 'string' && Number.isNaN(Number.parseInt(id))) {
        throw new Error("Invalid ID. Must be a number.")
    }
    const parsedId = Number(id)

    let { data, error } = await supabase
        .rpc('get_landmarks_with_stats', {
            target_id: parsedId
        })

    if (error) {
        throw error;
    }
    return data ? (data[0] as LandmarkWithStats) : null;
}
