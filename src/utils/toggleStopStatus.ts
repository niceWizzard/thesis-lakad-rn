import { POI } from "../model/poi.types";
import { supabase } from "./supabase";

export async function toggleStopStatus(poi : POI) {
    const isMarkingAsVisited = !poi.visited_at;
    const newVisitedAt = isMarkingAsVisited ? new Date().toISOString() : null;
    const { error: updateError } = await supabase
        .from('poi')
        .update({ visited_at: newVisitedAt })
        .eq('id', poi.id);

    if (updateError) throw updateError;

    const { data: allPois, error: fetchError } = await supabase
        .from('poi')
        .select('*')
        .eq('itinerary_id', poi.itinerary_id);

    if (fetchError || !allPois) throw fetchError || new Error("No data");

    const sortedPois = [...allPois].sort((a, b) => {
        if (a.visited_at && !b.visited_at) return -1;
        if (!a.visited_at && b.visited_at) return 1;
        if (a.visited_at && b.visited_at) {
            return new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime();
        }
        return (a.visit_order ?? 0) - (b.visit_order ?? 0);
    });

    const updates = sortedPois.map((item, index) => ({
        id: item.id,
        itinerary_id: item.itinerary_id,
        landmark_id: item.landmark_id,
        visit_order: index + 1,
        visited_at: item.visited_at
    }));

    const { error: bulkError } = await supabase
        .from('poi')
        .upsert(updates, { onConflict: 'id' });

    if (bulkError) throw bulkError;
}