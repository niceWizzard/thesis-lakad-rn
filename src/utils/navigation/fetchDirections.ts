import { MAPBOX_DIRECTIONS_URL } from "@/src/constants/url";

const ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

interface MapboxManeuver {
    type: string
    instruction: string
    location: [number, number]
    distance: number
    bearing_after: number
    bearing_before: number
}

interface MapboxStep {
    duration: number
    distance: number
    name: string
    driving_side: "left" | "right" | "straight"
    weight: number
    mode: "driving" | "walking" | "cycling"
    geometry: GeoJSON.LineString
    maneuver: MapboxManeuver
}

interface MapboxLeg {
    weight: number
    duration: number
    distance: number
    summary: string
    steps: MapboxStep[]
}

export interface MapboxRoute {
    weight_name: string
    weight: number
    duration: number
    distance: number
    geometry: GeoJSON.LineString
    legs: MapboxLeg[]
}

interface MapboxWaypoint {
    distance: number
    name: string
    location: [number, number]
}

export interface MapboxResponse {
    code: "Ok" | string
    routes: MapboxRoute[]
    waypoints: MapboxWaypoint[]
    uuid: string
}


export const fetchDirections = async ({
    waypoints,
    steps = true,
    accessToken = ACCESS_TOKEN,
    alternatives = true,
    overview = 'full',
    profile = 'driving',
    exclude = [],
}: {
    waypoints: [number, number][],
    steps?: boolean,
    alternatives?: boolean,
    accessToken?: string,
    overview?: 'full' | 'simplified' | 'false',
    profile?: 'driving' | 'walking' | 'cycling',
    exclude?: string[],
}): Promise<MapboxResponse> => {
    const coordinates = waypoints.map(v => v.join(',')).join(';');
    const url = new URL(`${MAPBOX_DIRECTIONS_URL}/${profile}/` + coordinates)
    url.searchParams.set('geometries', 'geojson')
    url.searchParams.set('steps', steps.toString())
    url.searchParams.set('alternatives', alternatives.toString())
    url.searchParams.set('access_token', accessToken)
    url.searchParams.set('overview', overview)
    if (exclude.length > 0) url.searchParams.set('exclude', exclude.join(','))
    try {
        const response = await fetch(url.toString())
        const data: MapboxResponse = await response.json()
        if (data.code !== "Ok")
            throw new Error(`Mapbox API Error code: ${data.code}. ${JSON.stringify(data, null, 2)}`)
        return data
    } catch (error) {
        console.error(error)
        throw error
    }
}