import { Database } from "@/database.types";
import { Landmark } from "./landmark.types";

export type POI = Database['public']['Tables']['poi']['Row']
export type POIWithLandmark = POI & {
    landmark: Landmark
}

