import { Session } from "@supabase/supabase-js";
import { create } from "zustand";


interface AuthStore {
    session?: Session | null
    setAuth(userId: Session, isAdmin?: boolean): void
    isAdmin: boolean
    setIsAdmin(isAdmin: boolean): void
}


export const useAuthStore = create<AuthStore>((set, get) => ({
    setAuth(session, isAdmin) {
        set({
            session,
            isAdmin: isAdmin ?? get().isAdmin,
        })
    },
    isAdmin: false,
    setIsAdmin(isAdmin) {
        set({
            isAdmin
        })
    }
}))