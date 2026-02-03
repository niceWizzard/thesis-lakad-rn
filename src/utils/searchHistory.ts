import { mmkvStorage } from "./mmkv";

const SEARCH_HISTORY_KEY = 'recent_searches_ids';
const MAX_HISTORY_SIZE = 5;

/**
 * Retrieves the list of recently searched landmark IDs from local storage.
 */
export const getRecentSearches = (): number[] => {
    const json = mmkvStorage.getString(SEARCH_HISTORY_KEY);
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch (e) {
        return [];
    }
}

/**
 * Adds a landmark ID to the recent searches list.
 * Maintains a maximum size and removes duplicates (moves existing to top).
 */
export const addRecentSearch = (id: number) => {
    const current = getRecentSearches();
    // Remove if exists to re-add at top
    const filtered = current.filter(existingId => existingId !== id);
    // Add to beginning
    const updated = [id, ...filtered].slice(0, MAX_HISTORY_SIZE);

    mmkvStorage.set(SEARCH_HISTORY_KEY, JSON.stringify(updated));
}

/**
 * Clears the recent search history.
 */
export const clearRecentSearches = () => {
    mmkvStorage.delete(SEARCH_HISTORY_KEY);
}
