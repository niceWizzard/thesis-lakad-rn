import { supabase } from "../supabase";

export const fetchReviewById = async (landmarkId: string | number, userId: string) => {
    if (typeof landmarkId !== 'number') {
        landmarkId = Number(landmarkId);
    }
    const { data } = await supabase
        .from('landmark_reviews')
        .select('*')
        .eq('landmark_id', landmarkId)
        .eq('user_id', userId)
        .single();

    if (!data) return null;

    const publicUrls = (data.images || []).map(img => {
        if (img.includes('supabase.co')) return img;
        return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
    });

    return {
        ...data,
        images: publicUrls,
    };
}