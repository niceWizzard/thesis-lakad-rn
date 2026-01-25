import { supabase } from "./supabase";

export const fetchLandmarks = async () => {
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


export const fetchArchivedLandmarks = async () => {
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



export const fetchLandmarkById = async (id: number | string) => {
    if(typeof id === 'string' && Number.isNaN(Number.parseInt(id))) {
        throw new Error("Invalid ID. Must be a number.")
    }
    const parsedId = Number(id)
    const { data, error } = await supabase
        .from('landmark')
        .select('*')
        .eq('creation_type', "TOURIST_ATTRACTION")
        .eq('id', parsedId)
        .order('created_at', { ascending: false })
        .single();

    if (error) {
        throw error;
    }

    return data;
}