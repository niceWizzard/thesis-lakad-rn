import { Place } from "@/src/model/places.types";
import { supabase } from "../supabase";

/**
 * Fetches all active pasalubong centers from the database.
 * @returns {Promise<Place[]>} Array of active pasalubong centers, sorted by most recently updated.
 */
export const fetchPasalubongCenters = async (): Promise<Place[]> => {
    const { data, error } = await supabase
        .from('places')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

    if (error) {
        throw error;
    }

    // Map to Place type with defaults for UI compatibility
    return data.map((item: any) => ({
        ...item,
        type: 'Pasalubong Center'
    })) as Place[];
}

/**
 * Fetches all archived or "soft-deleted" pasalubong centers.
 * @returns {Promise<Place[]>} Array of deleted pasalubong centers.
 */
export const fetchArchivedPasalubongCenters = async (): Promise<Place[]> => {
    const { data, error } = await supabase
        .from('places')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('updated_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data.map((item: any) => ({
        ...item,
        type: 'Pasalubong Center'
    })) as Place[];
}

/**
 * Retrieves a single pasalubong center record by its unique identifier.
 * @param {number | string} id - The unique ID of the pasalubong center.
 * @returns {Promise<Place>} A single pasalubong center object.
 */
export const fetchPasalubongCenterById = async (id: number | string): Promise<Place> => {
    if (typeof id === 'string' && Number.isNaN(Number.parseInt(id))) {
        throw new Error("Invalid ID. Must be a number.")
    }
    const parsedId = Number(id)
    const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', parsedId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return {
        ...data,
        type: 'Pasalubong Center'
    } as unknown as Place;
}
