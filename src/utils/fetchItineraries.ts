import { ItineraryWithStops } from "../model/itinerary.types"
import { supabase } from "./supabase"

export async function fetchItinerariesOfUser(userId: string) {
  const { data, error } = await supabase
    .from('itinerary')
    .select(`
      id,
      name,
      created_at,
      user_id,
      stops:poi (
        id,
        visited_at,
        visit_order,
        itinerary_id,
        landmark (
          id,
          name,
          longitude,
          latitude,
          categories,
          created_by_user
        )
      )
    `)
    .eq('user_id', userId)
    // Order directly on the 'stops' (poi) table
    .order('visit_order', { referencedTable: 'stops', ascending: true })

  if (error) throw error

  return data as unknown as ItineraryWithStops[]
}

export async function fetchItineraryById(userId: string, itineraryId: number) {
  const { data, error } = await supabase
    .from('itinerary')
    .select(`
      id,
      name,
      created_at,
      user_id,
      stops:poi (
        id,
        visited_at,
        visit_order,
        itinerary_id,
        landmark (
          id,
          name,
          longitude,
          latitude,
          categories,
          created_by_user
        )
      )
    `)
    .eq('user_id', userId)
    .eq('id', itineraryId)
    .order('visit_order', { referencedTable: 'stops', ascending: true })
    .single()

  if (error) throw error

  return data as unknown as ItineraryWithStops
}

export async function createItinerary({ itineraryName, poiIds }: { itineraryName?: string, poiIds: number[] }) {
  // Use a cleaner date format for the default name
  const dateStr = new Date().toLocaleDateString();

  const { data: newId, error } = await supabase.rpc('create_full_itinerary', {
    p_name: itineraryName ?? `Adventure ${dateStr}`,
    p_landmark_list: poiIds, // Our updated RPC handles the flat list and order
  });

  if (error) throw error
  if (!newId) throw new Error("Itinerary was not created.")

  return newId;
}