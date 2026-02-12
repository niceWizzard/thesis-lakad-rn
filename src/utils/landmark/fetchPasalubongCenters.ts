import { Landmark } from "@/src/model/landmark.types";
import { supabase } from "../supabase";

/**
 * Fetches all active pasalubong centers from the database.
 * @returns {Promise<Landmark[]>} Array of active pasalubong centers, sorted by most recently updated.
 */
export const fetchPasalubongCenters = async (): Promise<Landmark[]> => {
    const { data, error } = await supabase
        .from('pasalubong_centers')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

    if (error) {
        throw error;
    }

    // Map to Landmark type with defaults for UI compatibility
    return data.map((item: any) => ({
        ...item,
        type: 'Pasalubong Center'
    })) as Landmark[];
}

/**
 * Fetches all archived or "soft-deleted" pasalubong centers.
 * @returns {Promise<Landmark[]>} Array of deleted pasalubong centers.
 */
export const fetchArchivedPasalubongCenters = async (): Promise<Landmark[]> => {
    const { data, error } = await supabase
        .from('pasalubong_centers')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('updated_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data.map((item: any) => ({
        ...item,
        type: 'Pasalubong Center'
    })) as Landmark[];
}

/**
 * Retrieves a single pasalubong center record by its unique identifier.
 * @param {number | string} id - The unique ID of the pasalubong center.
 * @returns {Promise<Landmark>} A single pasalubong center object.
 */
export const fetchPasalubongCenterById = async (id: number | string): Promise<Landmark> => {
    if (typeof id === 'string' && Number.isNaN(Number.parseInt(id))) {
        throw new Error("Invalid ID. Must be a number.")
    }
    const parsedId = Number(id)
    const { data, error } = await supabase
        .from('pasalubong_centers')
        .select('*')
        .eq('id', parsedId)
        .single();

    if (error) {
        throw error;
    }

    return {
        ...data,
        type: 'Pasalubong Center'
    } as unknown as Landmark;
}
