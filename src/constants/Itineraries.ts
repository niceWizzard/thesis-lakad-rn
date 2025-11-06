import { historicalLandmarks } from "./Landmarks";

export interface POI {
    name : string;
    longitude: number
    latitude: number
    visited: boolean;
}

export interface Itinerary {
    name: string;
    id: string;
    poiOrder: POI[]
}


export const DEFAULT_ITINERARIES : Itinerary[] = [
    {
        id: 'Malolos1',
        name: 'Test 1',
        poiOrder: [
            {
                latitude: historicalLandmarks[8].latitude,
                longitude: historicalLandmarks[8].longitude,
                name: historicalLandmarks[8].name,
                visited: false,
            },
            {
                latitude: historicalLandmarks[1].latitude,
                longitude: historicalLandmarks[1].longitude,
                name: historicalLandmarks[1].name,
                visited: false,
            },
            {
                latitude: historicalLandmarks[2].latitude,
                longitude: historicalLandmarks[2].longitude,
                name: historicalLandmarks[2].name,
                visited: false,
            },
        ]
    },
    {
        id: 'Malolos2',
        name: 'Test 2',
        poiOrder: [
            {
                latitude: historicalLandmarks[0].latitude,
                longitude: historicalLandmarks[0].longitude,
                name: historicalLandmarks[0].name,
                visited: false,
            },
            {
                latitude: historicalLandmarks[4].latitude,
                longitude: historicalLandmarks[4].longitude,
                name: historicalLandmarks[4].name,
                visited: false,
            },
            {
                latitude: historicalLandmarks[6].latitude,
                longitude: historicalLandmarks[6].longitude,
                name: historicalLandmarks[6].name,
                visited: false,
            },
        ]
    },
]
