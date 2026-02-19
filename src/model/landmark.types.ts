import { Database } from "@/database.types";
import { OpeningHours } from "./hours.types";

export type Landmark = Database['public']['Tables']['landmark']['Row'] & {
    landmark_opening_hours?: OpeningHours[]
}

export type LandmarkType = Landmark['type']
export type LandmarkDistrict = Landmark['district']
export type LandmarkMunicipality = Landmark['municipality']