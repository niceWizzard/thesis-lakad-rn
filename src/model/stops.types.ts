import { Database } from "@/database.types";
import { Landmark } from "./landmark.types";

export type Stop = Database['public']['Tables']['stops']['Row']
export type StopWithLandmark = Stop & {
    landmark: Landmark
}

