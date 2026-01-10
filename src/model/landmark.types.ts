import { Database } from "@/database.types";

export type Landmark = Database['public']['Tables']['landmark']['Row']

export type LandmarkCategory = Landmark['categories'][number]