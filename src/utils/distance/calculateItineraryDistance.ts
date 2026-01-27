import { MAPBOX_DIRECTIONS_URL } from "@/src/constants/url";
import { MapboxResponse } from "../navigation/fetchDirections";

const MAX_WAYPOINTS = 25

const ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";


export async function calculateItineraryDistance(waypoints: [number, number][]) {
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length; i += MAX_WAYPOINTS) {
        const chunk = waypoints.slice(i, i + MAX_WAYPOINTS)
        const chunkedWaypoint = chunk.map(v => v.join(',')).join(';')
        const url = new URL(`${MAPBOX_DIRECTIONS_URL}/driving/` + chunkedWaypoint);
        url.searchParams.set('steps', 'false')
        url.searchParams.set('alternatives', 'false')
        url.searchParams.set('access_token', ACCESS_TOKEN)

        try {
            const response = await fetch(url.toString())
            const data: MapboxResponse = await response.json()
            if (data.code !== "Ok")
                throw new Error(`Mapbox API Error code: ${data.code}. ${JSON.stringify(data, null, 2)}`)
            totalDistance += data.routes[0].distance || 0
        } catch (error) {
            console.error(error)
            throw error
        }
    }
    return totalDistance;
}