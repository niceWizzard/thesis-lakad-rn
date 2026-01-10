import { supabase } from "./supabase"

export const fetchAdminStatus = async (userId: string) => {
    const response = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", userId)
        .single()

    if (response.data == null)
        throw new Error("User not found.")
    return response.data.is_admin
}