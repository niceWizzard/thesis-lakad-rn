import { Database } from "@/database.types";

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type UserType = Profile['user_type']