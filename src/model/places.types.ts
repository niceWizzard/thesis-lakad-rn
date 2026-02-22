import { Database } from "@/database.types";
import { OpeningHours } from "./hours.types";

export type Place = Database['public']['Tables']['places']['Row'] & {
    landmark_opening_hours?: OpeningHours[]
}

export type PlaceInsert = Database['public']['Tables']['places']['Insert']

export type PlaceWithStats = Place & {
    review_count: number
    average_rating: number
    opening_hours: OpeningHours[]
}

export type PlaceType = Place['type']
export type PlaceDistrict = Place['district']
export type PlaceMunicipality = Place['municipality']