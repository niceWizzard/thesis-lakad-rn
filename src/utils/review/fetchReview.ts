import { Place } from "@/src/model/places.types";
import { ReviewWithAuthor } from "@/src/model/review.types";
import { supabase } from "../supabase";

export const fetchReviewById = async (placeId: string | number, userId: string): Promise<ReviewWithAuthor | null> => {
    if (typeof placeId !== 'number') {
        placeId = Number(placeId);
    }
    const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('place_id', placeId)
        .eq('user_id', userId)
        .maybeSingle();

    if (!data) return null;

    let author_name: string | null = null;
    if (data.user_id) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', data.user_id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }

        if (profile?.full_name) {
            author_name = profile.full_name;
        }
    }

    if (author_name === null) {
        return null;
    }



    const publicUrls = (data.images || []).map(img => {
        if (img.includes('supabase.co')) return img;
        return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
    });

    return {
        ...data,
        images: publicUrls,
        author_name,
    };
}

export const fetchRecentReviewsByLandmarkId = async (landmarkId: string | number, limit: number = 3): Promise<ReviewWithAuthor[]> => {
    if (typeof landmarkId !== 'number') {
        landmarkId = Number(landmarkId);
    }

    const { data: reviewsData, error } = await supabase.rpc('get_recent_reviews_by_place', {
        place_id_input: landmarkId,
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
    placeId,
    pageNumber = 1,
    pageSize = 10,
    ratingFilter,
    sortColumn = 'created_at',
    sortDescending = true,
    ignoreUserId = undefined,
}: {
    placeId: string | number;
    pageNumber?: number;
    pageSize?: number;
    ratingFilter?: number;
    sortColumn?: string;
    sortDescending?: boolean;
    ignoreUserId?: string;
}): Promise<ReviewWithAuthor[]> => {
    if (typeof placeId !== 'number') {
        placeId = Number(placeId);
    }

    // Prepare arguments, explicitly pass undefined for optional params if not provided
    const args: any = {
        place_id_input: placeId,
        page_number: pageNumber,
        page_size: pageSize,
        sort_column: sortColumn,
        sort_descending: sortDescending
    };

    if (ratingFilter !== undefined && ratingFilter > 0) {
        args.rating_filter = ratingFilter;
    }

    if (ignoreUserId) {
        args.ignore_user_id = ignoreUserId;
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

export async function fetchReviewByReviewId(reviewId: string): Promise<ReviewWithAuthor | null> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', Number(reviewId!))
        .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch author profile
    let author_name: string | null = null;
    if (data.user_id) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', data.user_id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }

        if (profile?.full_name) {
            author_name = profile.full_name;
        }
    }

    if (author_name === null) {
        return null;
    }

    const publicUrls = (data.images || []).map((img: string) => {
        if (img.includes('supabase.co')) return img;
        return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
    });

    return { ...data, images: publicUrls, author_name };
}

export const fetchMyReviews = async (userId: string): Promise<(ReviewWithAuthor & { place: Place })[]> => {
    const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
            *,
            place:places(*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching user reviews:', error);
        throw error;
    }

    if (!reviewsData || reviewsData.length === 0) return [];

    // Fetch user profile name (since it's their own review)
    let author_name = "You";
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle();

    if (profile?.full_name) {
        author_name = profile.full_name;
    }

    return reviewsData.map(review => {
        const publicUrls = (review.images || []).map((img: string) => {
            if (img.includes('supabase.co')) return img;
            return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
        });

        return {
            ...review,
            images: publicUrls,
            author_name,
            place: Array.isArray(review.place) ? review.place[0] : review.place,
        };
    }) as (ReviewWithAuthor & { place: Place })[];
};