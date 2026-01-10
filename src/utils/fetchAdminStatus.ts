import { supabase } from "./supabase"

export const fetchAdminStatus = async (userId: string) => {
    const response = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", userId)
        .single()

    if (response.data == null)
        throw new Error("User not found.")
    return response.data.user_type
}