import { supabase } from "./supabase";

/**
 * Updates the visit duration of a stop.
 * @param stopId - The ID of the stop to update.
 * @param durationMinutes - The new duration in minutes.
 */
export async function updateStopDuration(stopId: number, durationMinutes: number) {
    const { error } = await supabase
        .from('stops')
        .update({ visit_duration: durationMinutes })
        .eq('id', stopId);

    if (error) throw error;
}
