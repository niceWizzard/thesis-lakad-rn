import { Database } from "@/database.types";
import { Landmark } from "./landmark.types";
import { Stop } from "./stops.types";

export type Itinerary = Database['public']['Tables']['itinerary']['Row']
export type ItineraryInsert = Database['public']['Tables']['itinerary']['Insert']

export type ItineraryWithStops = Itinerary & {
    stops: (Stop & {
        landmark: Landmark
    })[];
}

