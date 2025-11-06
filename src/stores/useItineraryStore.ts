import { create } from "zustand";
import { DEFAULT_ITINERARIES, Itinerary, POI } from "../constants/Itineraries";


export const useItineraryStore = create<{
    itineraries: Itinerary[],
    addItinerary: (a : Itinerary) => void,
    addPoiToItinerary: (poi : POI, itineraryId: string) => void,
    setItineraryPoiOrder: (poiOrder: POI[], itineraryId: string) => void,
    deleteItinerary: (id: string) => void,
}>((set, get) => ({
    itineraries: [...DEFAULT_ITINERARIES],
    addItinerary: (itinerary) => {
        set(v => ({
            itineraries: [...v.itineraries, itinerary],
        }))
    },
    addPoiToItinerary(poi, itineraryId) {
        const list = get().itineraries
        const itinerary = list.find(itinerary => itinerary.id == itineraryId)
        if(!itinerary){
            throw new Error('Invalid itinerary id!')
        }
        itinerary.poiOrder = [
            ...itinerary.poiOrder,
            poi,
        ]
    },
    setItineraryPoiOrder(poiOrder, itineraryId) {
        const list = get().itineraries
        const itinerary = list.find(itinerary => itinerary.id == itineraryId)
        if(!itinerary){
            throw new Error('Invalid itinerary id!')
        }
        itinerary.poiOrder = poiOrder
    },
    deleteItinerary(id) {
        const list = get().itineraries
        set({
            itineraries: list.filter(v => v.id !== id)
        })
    }

}))
