
const BASE_URl = 'https://api.mapbox.com/directions/v5/mapbox/driving'

const ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

interface MapboxManeuver {
    type: string
    instruction: string
    location: [number, number]
}

interface MapboxStep {
    duration: number
    distance: number
    name: string
    driving_side: "left" | "right" | "straight"
    weight: number
    mode: "driving" | "walking" | "cycling"
    geometry: GeoJSON.Geometry
}

interface MapboxLeg {
    weight: number
    duration: number
    distance: number
    summary: string
    steps: MapboxStep[]
}

interface MapboxRoute {
    weight_name: string
    weight: number
    duration: number
    distance: number
    geometry: GeoJSON.Geometry
    legs: MapboxLeg[]
}

interface MapboxWaypoint {
    distance: number
    name: string
    location: [number, number]
}

interface MapboxResponse {
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
}: {
    waypoints: [number, number][],
    steps?: boolean,
    alternatives?: boolean,
    accessToken?: string,
}): Promise<MapboxResponse> => {
    const coordinates = waypoints.map(v => v.join(',')).join(';');
    const url = new URL(BASE_URl + "/" + coordinates)
    url.searchParams.set('geometries', 'geojson')
    url.searchParams.set('steps', steps.toString())
    url.searchParams.set('alternatives', alternatives.toString())
    url.searchParams.set('access_token', accessToken)
    try {
        const response = await fetch(url.toString())
        const data: MapboxResponse = await response.json()
        if (data.code !== "Ok")
            throw new Error(`Mapbox API Error code: ${data.code}`)
        return data
    } catch (error) {
        console.error(error)
        throw error
    }
}