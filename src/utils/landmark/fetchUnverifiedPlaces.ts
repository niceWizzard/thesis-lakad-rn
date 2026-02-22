import { PlaceWithStats } from "@/src/model/places.types";
import { supabase } from "../supabase";

export const fetchUnverifiedPlaces = async (): Promise<PlaceWithStats[]> => {
    const { data, error } = await supabase
        .from('places')
        .select('*, opening_hours(*)')
        .is('deleted_at', null)
        .is('is_verified', false)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return (data ?? []) as PlaceWithStats[];
}

export const fetchArchivedUnverifiedPlaces = async (): Promise<PlaceWithStats[]> => {
    const { data, error } = await supabase
        .from('places')
        .select('*, opening_hours(*)')
        .is('is_verified', false)
        .not('deleted_at', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return (data ?? []) as PlaceWithStats[];
}