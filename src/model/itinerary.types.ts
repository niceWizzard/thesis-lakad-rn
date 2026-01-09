import { Database } from "@/database.types";
import { Landmark } from "./landmark.types";
import { POI } from "./poi.types";

export type Itinerary = Database['public']['Tables']['itinerary']['Row']
export type ItineraryInsert = Database['public']['Tables']['itinerary']['Insert']

export type ItineraryWithStops = Itinerary & {
    stops: {
        visit_order: number;
        poi: POI & {
            landmark: Landmark | null;
        };
    }[];
}