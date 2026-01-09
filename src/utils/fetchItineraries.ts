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
      stops:itinerary_poi_order (
        visit_order,
        poi (
          id,
          visited_at,
          itinerary_id,
          created_at,
          landmark(
            id,
            name,
            longitude,
            latitude,
            categories,
            created_by_user
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('visit_order', { referencedTable: 'stops', ascending: true })

  if (error)
    throw error

  return data as ItineraryWithStops[]
}

export async function fetchItineraryById(userId: string, itineraryId: number) {
  const { data, error } = await supabase
    .from('itinerary')
    .select(`
      id,
      name,
      created_at,
      user_id,
      stops:itinerary_poi_order (
        visit_order,
        poi (
          id,
          visited_at,
          itinerary_id,
          created_at,
          landmark(
            id,
            name,
            longitude,
            latitude,
            categories,
            created_by_user
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('id', itineraryId)
    .order('visit_order', { referencedTable: 'stops', ascending: true })
    .single()

  if (error)
    throw error

  return data as ItineraryWithStops
}


export async function createItinerary({ itineraryName, poiIds }: { itineraryName?: string, poiIds: number[] }) {
  const date = new Date()
  const { data: newId, error } = await supabase.rpc('create_full_itinerary', {
    p_name: itineraryName ?? 'My New Adventure ' + date.toString(),
    p_landmark_list: poiIds,
  });

  if (error)
    throw error
  if (!newId)
    throw new Error("Itinerary was not created.")

  return newId;
}