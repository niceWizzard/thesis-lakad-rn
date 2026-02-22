import { Database } from "@/database.types";
import { Place } from "./places.types";
import { Stop } from "./stops.types";

export type Itinerary = Database['public']['Tables']['itinerary']['Row']
export type ItineraryInsert = Database['public']['Tables']['itinerary']['Insert']

export type ItineraryWithStops = Itinerary & {
    stops: (Stop & {
        place: Place
    })[];
}

