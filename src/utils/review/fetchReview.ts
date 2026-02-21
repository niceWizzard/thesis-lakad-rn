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

export const fetchRecentReviewsByLandmarkId = async (landmarkId: string | number, limit: number = 3) => {
    if (typeof landmarkId !== 'number') {
        landmarkId = Number(landmarkId);
    }

    const { data: reviewsData, error } = await supabase.rpc('get_recent_reviews_by_landmark', {
        landmark_id_input: landmarkId,
        limit_input: limit,
    });

    if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }

    if (!reviewsData || reviewsData.length === 0) return [];

    return reviewsData.map(review => {
        const publicUrls = (review.images || []).map(img => {
            if (img.includes('supabase.co')) return img;
            return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
        });

        return {
            ...review,
            images: publicUrls,
        };
    });
};

export const fetchFilterableReviews = async ({
    landmarkId,
    pageNumber = 1,
    pageSize = 10,
    ratingFilter,
    sortColumn = 'created_at',
    sortDescending = true
}: {
    landmarkId: string | number;
    pageNumber?: number;
    pageSize?: number;
    ratingFilter?: number;
    sortColumn?: string;
    sortDescending?: boolean;
}) => {
    if (typeof landmarkId !== 'number') {
        landmarkId = Number(landmarkId);
    }

    // Prepare arguments, explicitly pass undefined for optional params if not provided
    const args: any = {
        landmark_id_input: landmarkId,
        page_number: pageNumber,
        page_size: pageSize,
        sort_column: sortColumn,
        sort_descending: sortDescending
    };

    if (ratingFilter !== undefined && ratingFilter > 0) {
        args.rating_filter = ratingFilter;
    }

    const { data: reviewsData, error } = await supabase.rpc('get_filterable_reviews', args);

    if (error) {
        console.error('Error fetching filterable reviews:', error);
        throw error;
    }

    if (!reviewsData || reviewsData.length === 0) return [];

    return reviewsData.map(review => {
        const publicUrls = (review.images || []).map(img => {
            if (img.includes('supabase.co')) return img;
            return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
        });

        return {
            ...review,
            images: publicUrls,
        };
    });
};