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
      distance,
      stops (
        id,
        visited_at,
        visit_order,
        itinerary_id,
        landmark_id,
        landmark (
          id,
          name,
          longitude,
          latitude,
          type,
          image_url,
          municipality,
          district,
          creation_type
        )
      )
    `)
    .eq('user_id', userId)
    .is('deleted_at', null) // Filter out deleted items
    // Order itineraries by newest first
    .order('created_at', { ascending: false })
    // Order directly on the 'stops' (stops) table
    .order('visit_order', { referencedTable: 'stops', ascending: true })

  if (error) throw error

  return data as unknown as ItineraryWithStops[]
}

export async function fetchArchivedItineraries(userId: string) {
  const { data, error } = await supabase
    .from('itinerary')
    .select(`
        id,
        name,
        created_at,
        deleted_at,
        user_id,
        distance,
        stops (
          id,
          visited_at,
          visit_order,
          visit_duration,
          itinerary_id,
          landmark_id,
          landmark (
            id,
            name,
            longitude,
            latitude,
            type,
            image_url,
            municipality,
            district,
            creation_type
          )
        )
      `)
    .eq('user_id', userId)
    .not('deleted_at', 'is', null) // Fetch ONLY deleted items
    .order('deleted_at', { ascending: false })

  if (error) throw error

  return data as unknown as ItineraryWithStops[]
}

export async function restoreItinerary(itineraryId: number) {
  const { error } = await supabase
    .from('itinerary')
    .update({ deleted_at: null })
    .eq('id', itineraryId)

  if (error) throw error
}

export async function permanentlyDeleteItinerary(itineraryId: number) {
  const { error } = await supabase
    .from('itinerary')
    .delete()
    .eq('id', itineraryId)

  if (error) throw error
}

export async function fetchItineraryById(userId: string, itineraryId: number) {
  const { data, error } = await supabase
    .from('itinerary')
    .select(`
      id,
      name,
      created_at,
      user_id,
      distance,
      stops (
        id,
        visited_at,
        visit_order,
        visit_duration,
        itinerary_id,
        landmark_id,
        landmark (
          id,
          name,
          longitude,
          latitude,
          type,
          image_url,
          municipality,
          district,
          creation_type,
          description
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

export async function createItinerary({ itineraryName, poiIds, distance }: { itineraryName?: string, poiIds: number[], distance: number }) {
  // Use a cleaner date format for the default name
  const dateStr = new Date().toLocaleDateString();

  const { data: newId, error } = await supabase.rpc('create_full_itinerary', {
    p_name: itineraryName ?? `Adventure ${dateStr}`,
    p_distance: distance,
    p_landmark_list: poiIds, // Our updated RPC handles the flat list and order
  });

  if (error) throw error
  if (!newId) throw new Error("Itinerary was not created.")

  return newId;
}


export async function createItineraryOnly({ itineraryName, distance, userId }: { itineraryName?: string, userId: string, distance: number }): Promise<number> {
  const dateStr = new Date().toLocaleDateString();
  const { error, data: itinerary } = await supabase.from('itinerary').insert({
    name: itineraryName ?? `Adventure ${dateStr}`,
    user_id: userId,
    distance,
  }).select('id').single()

  if (error) throw error
  if (!itinerary) throw new Error("Itinerary was not created.")
  return itinerary.id
}