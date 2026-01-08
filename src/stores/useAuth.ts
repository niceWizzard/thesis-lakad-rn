import { AuthSession } from "@supabase/supabase-js";
import { create } from "zustand";


interface AuthStore {
    session?: AuthSession
    setAuth(userId: AuthSession): void
}


export const useAuthStore = create<AuthStore>((set, get) => ({
    setAuth(session) {
        set({
            session
        })
    }
}))