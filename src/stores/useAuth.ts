import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { UserType } from "../model/profile.types";


interface AuthStore {
    session?: Session | null
    setAuth(userId: Session, userType?: UserType): void
    isAdmin: boolean
    userType: UserType
    setUserType(isAdmin: UserType): void
}


export const useAuthStore = create<AuthStore>((set, get) => ({
    setAuth(session, userType) {
        set({
            session,
            userType: userType ?? get().userType,
            isAdmin: userType === 'Regular' ? false : true,
        })
    },
    userType: 'Regular',
    setUserType(userType) {
        set({
            userType,
            isAdmin: userType === 'Regular' ? false : true,
        })
    },
    isAdmin: false,
}))