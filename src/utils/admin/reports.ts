import { Database } from '@/database.types';
import { supabase } from '@/src/utils/supabase';

export type ReviewReportStatus = Database['public']['Enums']['review_report_status'];

export interface ReportWithDetails {
    id: number;
    created_at: string;
    details: string;
    reason: string;
    reporter_id: string;
    review_id: number;
    status: ReviewReportStatus;

    // Joined data
    reporter_name: string;
    reviewer_name: string;
    review_content: string;
    landmark_name: string;
    review_images: string[];
    review_rating: number;
}

export const fetchAdminReports = async (status: ReviewReportStatus = 'PENDING'): Promise<ReportWithDetails[]> => {
    const { data: reports, error } = await supabase.rpc('get_review_reports', { p_status: status });
    if (error) {
        console.error('Error fetching admin reports:', error);
        throw error;
    }
    reports.forEach((report) => {
        report.review_images = report.review_images.map((image) => supabase.storage.from('images').getPublicUrl(image).data?.publicUrl);
    });
    return reports;
};

export const fetchReportById = async (reportId: string | number): Promise<ReportWithDetails | null> => {
    const reportIdNumber = Number(reportId);
    const { data: report, error } = await supabase.rpc(
        'get_review_report_by_id',
        { p_report_id: reportIdNumber }
    );
    if (error) {
        console.error('Error fetching admin report by ID:', error);
        throw error;
    }
    if (!report || report.length === 0) {
        return null;
    }
    return report[0];
};

export const updateReportStatus = async (reportId: number, status: ReviewReportStatus): Promise<void> => {
    const { error } = await supabase
        .from('review_reports')
        .update({ status })
        .eq('id', reportId);

    if (error) {
        console.error('Error updating report status:', error);
        throw error;
    }
};

export const dismissReport = async (reportId: number) => {
    return updateReportStatus(reportId, 'DISMISSED');
};

export const deleteReviewAndResolveReport = async (reviewId: number, reportId: number, imageUrls: string[] = []) => {
    console.log('[deleteReviewAndResolveReport] reviewId =', reviewId, '| reportId =', reportId);

    // 1. Clean up images from Supabase Storage (same logic as reviews.tsx)
    const imagesToRemove = imageUrls.map((url) => {
        if (url.includes('supabase.co')) {
            const pathWithQuery = url.split('/object/public/images/')[1];
            if (!pathWithQuery) return null;
            return pathWithQuery.split('?')[0];
        }
        return url;
    }).filter(Boolean) as string[];

    if (imagesToRemove.length > 0) {
        const { error: removeError } = await supabase.storage.from('images').remove(imagesToRemove);
        if (removeError) {
            console.warn('Failed to clean up review images from storage:', removeError);
        }
    }

    // 2. Delete the review row
    console.log('[deleteReviewAndResolveReport] Attempting to delete landmark_reviews row with id =', reviewId);
    const { data: deleteData, error: deleteError, count } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .select();

    console.log('[deleteReviewAndResolveReport] Delete result: data =', deleteData, '| count =', count, '| error =', deleteError);

    if (deleteError) {
        console.error('Error deleting review:', deleteError);
        throw deleteError;
    }

    if (!deleteData || deleteData.length === 0) {
        console.warn('[deleteReviewAndResolveReport] No rows deleted — RLS policy may be blocking the delete, or review_id does not exist.');
        throw new Error('Delete was blocked: no rows affected. Check RLS policies on landmark_reviews.');
    }

    // 3. Mark report as action_taken
    await updateReportStatus(reportId, 'ACTION_TAKEN');
};
