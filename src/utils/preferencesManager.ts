import { useMMKVString } from "react-native-mmkv"
import { StorageKey } from "../constants/Key"
import { mmkvStorage } from "./mmkv"

export const useTypePreferences = () => {
    const [value] = useMMKVString(StorageKey.Preferences)

    return JSON.parse(value ?? "[]") as string[]
}

export const getCategoryPreferences = () => {
    return JSON.parse(
        mmkvStorage.getString(StorageKey.Preferences) ?? "[]"
    ) as string[]
}


export const setCategoryPreferences = (preferences: string[]) => {
    mmkvStorage.set(StorageKey.Preferences, JSON.stringify(preferences))
}