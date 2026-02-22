import { Database } from "@/database.types";
import { OpeningHours } from "./hours.types";

export type Place = Database['public']['Tables']['places']['Row']

export type PlaceInsert = Database['public']['Tables']['places']['Insert']


export type PlaceWithOpeningHours = Place & {
    opening_hours: OpeningHours[]
}
export type PlaceWithStats = PlaceWithOpeningHours & {
    review_count: number
    average_rating: number
}

export type PlaceType = Place['type']
export type PlaceDistrict = Place['district']
export type PlaceMunicipality = Place['municipality']