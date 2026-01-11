import { supabase } from "./supabase";

export const fetchLandmarks = async () => {
    const { data, error } = await supabase
        .from('landmark')
        .select('*')
        .eq('created_by_user', false)
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
        .eq('created_by_user', false)
        .not('deleted_at', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}



export const fetchLandmarkById = async (id: number) => {
    const { data, error } = await supabase
        .from('landmark')
        .select('*')
        .eq('created_by_user', false)
        .eq('id', id)
        .order('created_at', { ascending: false })
        .single();

    if (error) {
        throw error;
    }

    return data;
}