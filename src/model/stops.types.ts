import { Database } from "@/database.types";
import { Place } from "./places.types";

export type Stop = Database['public']['Tables']['stops']['Row']
export type StopWithPlace = Stop & {
    place: Place
}

