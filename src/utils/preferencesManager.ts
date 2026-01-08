import { StorageKey } from "../constants/Key"
import { mmkvStorage } from "./mmkv"


export const getCategoryPreferences = () => {
    return JSON.parse(
        mmkvStorage.getString(StorageKey.Preferences) ?? "[]"
    ) as string[]
}


export const setCategoryPreferences = (preferences: string[]) => {
    mmkvStorage.set(StorageKey.Preferences, JSON.stringify(preferences))
}