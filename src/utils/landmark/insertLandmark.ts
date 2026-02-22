import { Database } from "@/database.types";
import { PlaceInsert } from "@/src/model/places.types";
import { supabase } from "../supabase";



/**
 * Inserts a landmark as a new stop within an existing itinerary.
 * * **Logic:** * Calculates the `visit_order` by incrementing the provided `currentCount`.
 * * @param {Object} params - The insertion parameters.
 * @param {string | number} params.landmarkId - The unique ID of the landmark to add.
 * @param {string | number} params.itineraryId - The unique ID of the target itinerary.
 * @param {string | number} params.currentCount - The current number of stops in the itinerary.
 * * @returns {Promise<void>} Resolves when the stop is successfully inserted.
 * * @throws {Error} If any ID or count provided is not a valid numeric representation.
 * @throws {PostgrestError} If the Supabase insertion fails (e.g., RLS violations).
 * * @example
 * await insertLandmarkToItinerary({
 * landmarkId: 101,
 * itineraryId: 5,
 * currentCount: 2
 * }); // Adds landmark 101 as the 3rd stop in itinerary 5.
 */
export const insertPlaceToItinerary = async ({
    currentCount,
    placeId,
    itineraryId,
}: {
    placeId: string | number,
    itineraryId: string | number,
    currentCount: string | number,
}) => {
    if (typeof placeId === 'string' && Number.isNaN(Number.parseInt(placeId))) {
        throw new Error("Invalid Place ID. Must be a number.")
    }

    if (typeof itineraryId === 'string' && Number.isNaN(Number.parseInt(itineraryId))) {
        throw new Error("Invalid Itinerary ID. Must be a number.")
    }

    if (typeof currentCount === 'string' && Number.isNaN(Number.parseInt(currentCount))) {
        throw new Error("Invalid Current Count. Must be a number.")
    }

    // Validation: Check for duplicates
    const { data: existingStop, error: duplicateError } = await supabase
        .from('stops')
        .select('id')
        .eq('itinerary_id', Number(itineraryId))
        .eq('place_id', Number(placeId))
        .limit(1)
        .maybeSingle();

    if (duplicateError) throw duplicateError;
    if (existingStop) {
        throw new Error("Landmark already in itinerary.");
    }

    // Validation: Check for itinerary limit (50 stops max)
    const { count, error: countError } = await supabase
        .from('stops')
        .select('*', { count: 'exact', head: true })
        .eq('itinerary_id', Number(itineraryId));

    if (countError) throw countError;
    if (count !== null && count >= 50) {
        throw new Error("Itinerary limit reached (50 stops max).");
    }

    const nextOrder = Number(currentCount) + 1;
    const { error } = await supabase.from('stops').insert({
        itinerary_id: Number(itineraryId),
        place_id: Number(placeId),
        visit_order: nextOrder,
    });
    if (error) throw error;
    return
}

/**
 * Creates a new landmark entry in the global database.
 * * @param {Database['public']['Tables']['landmark']['Insert']} data - The landmark data 
 * conforming to the Supabase schema (excludes ID which is auto-generated).
 * * @returns {Promise<number>} The ID of the newly created landmark.
 * * @throws {PostgrestError} If the database prevents the creation (e.g., duplicate unique fields).
 * @throws {Error} If the insertion completes but no ID is returned.
 * * @example
 * const newId = await createLandmark({
 * name: "Barasoain Church",
 * latitude: 14.847,
 * longitude: 120.812,
 * creation_type: "TOURIST_ATTRACTION"
 * });
 */
export const createPlace = async (data: PlaceInsert): Promise<number> => {
    const { error: dbError, data: dbData } = await supabase
        .from('places')
        .insert([{
            ...data,
        }])
        .select('id')
        .single();

    if (dbError) throw dbError;
    if (!dbData)
        throw new Error("Place was not created.")
    return dbData.id
}
