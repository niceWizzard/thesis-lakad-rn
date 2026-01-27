import { Database } from "@/database.types";
import { supabase } from "../supabase";

export const insertLandmarkToItinerary = async ({
    currentCount,
    landmarkId,
    itineraryId,
}: {
    landmarkId: string | number,
    itineraryId: string | number,
    currentCount: string | number,
}) => {
    if (typeof landmarkId === 'string' && Number.isNaN(Number.parseInt(landmarkId))) {
        throw new Error("Invalid Landmark ID. Must be a number.")
    }

    if (typeof itineraryId === 'string' && Number.isNaN(Number.parseInt(itineraryId))) {
        throw new Error("Invalid Itinerary ID. Must be a number.")
    }

    if (typeof currentCount === 'string' && Number.isNaN(Number.parseInt(currentCount))) {
        throw new Error("Invalid Current Count. Must be a number.")
    }

    const nextOrder = Number(currentCount) + 1;
    const { error } = await supabase.from('stops').insert({
        itinerary_id: Number(itineraryId),
        landmark_id: Number(landmarkId),
        visit_order: nextOrder,
    });
    if (error) throw error;
    return
}


export const createLandmark = async (data: Database['public']['Tables']['landmark']['Insert']) => {
    const { error: dbError, data: dbData } = await supabase
        .from('landmark')
        .insert([{
            ...data,
            created_at: new Date().toISOString(),
        }])
        .select('id')
        .single();

    if (dbError) throw dbError;
    if (!dbData)
        throw new Error("Landmark was not created.")
    return dbData.id
}