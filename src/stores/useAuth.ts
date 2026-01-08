import { Session } from "@supabase/supabase-js";
import { create } from "zustand";


interface AuthStore {
    session?: Session | null
    setAuth(userId: Session): void
}


export const useAuthStore = create<AuthStore>((set, get) => ({
    setAuth(session) {
        set({
            session
        })
    }
}))