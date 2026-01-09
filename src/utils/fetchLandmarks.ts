import { supabase } from "./supabase";

export const fetchLandmarks = async () => {
    const { data, error } = await supabase
        .from('landmark')
        .select('*') // Being explicit with '*' or specific columns is often safer
        .eq('created_by_user', false)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}