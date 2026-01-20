import { Database } from "@/database.types";

export type Landmark = Database['public']['Tables']['landmark']['Row']

export type LandmarkType = Landmark['type']
export type LandmarkDistrict = Landmark['district']
export type LandmarkMunicipality = Landmark['municipality']