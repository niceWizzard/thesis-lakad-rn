import { ACCESS_TOKEN as ORS_ACCESS_TOKEN } from "@/src/constants/token";
import { ORS_DIRECTIONS_URL } from "@/src/constants/url";

interface OrsError {
    error: {
        code: number,
        message: string,
    }
}

/**
 * Main response structure for OpenRouteService V2 Direction/Routing
 */
export interface ORSRouteResponse {
    bbox: [number, number, number, number];
    routes: ORSRoute[];
    metadata: ORSMetadata;
}

export interface ORSRoute {
    summary: ORSSummary;
    segments: ORSSegment[];
    bbox: [number, number, number, number];
    /** Encoded Polyline string */
    geometry: string;
    way_points: [number, number];
    warnings?: ORSWarning[];
    extras?: Record<string, any>;
    departure?: string;
    arrival?: string;
}

export interface ORSSummary {
    distance: number;
    duration: number;
    ascent?: number;
    descent?: number;
}

export interface ORSSegment {
    distance: number;
    duration: number;
    steps: ORSStep[];
    detourfactor?: number;
    percentage?: number;
    avgspeed?: number;
    ascent?: number;
    descent?: number;
}

export interface ORSStep {
    distance: number;
    duration: number;
    /** Action code for symbolization (e.g., 0=Left, 1=Right) */
    type: number;
    instruction: string;
    name: string;
    way_points: [number, number];
    maneuver: ORSManeuver;
    exit_number?: number;
    exit_bearings?: number[];
}

export interface ORSManeuver {
    location: [number, number];
    bearing_before: number;
    bearing_after: number;
}

export interface ORSWarning {
    code: number;
    message: string;
}

export interface ORSMetadata {
    id?: string;
    attribution: string;
    service: string;
    timestamp: number;
    query: Record<string, any>;
    engine: ORSEngineInfo;
}

export interface ORSEngineInfo {
    version: string;
    build_date: string;
    graph_date: string;
    osm_date: string;
    system_message?: string;
}

type ORSResponse<T> = T | OrsError



export async function calculateItineraryDistance(waypoints: [number, number][]) {
    try {
        const response = await fetch(`${ORS_DIRECTIONS_URL}/driving-car`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ORS_ACCESS_TOKEN,
            },
            body: JSON.stringify({
                coordinates: waypoints,
                options: {
                    avoid_features: ['tollways']
                }
            })
        })
        const data: ORSResponse<ORSRouteResponse> = await response.json()

        if ('error' in data)
            throw new Error(`ORS Error:${JSON.stringify(data.error, null, 2)}`)

        const route = data.routes[0];
        return route.summary.distance;

    } catch (error) {
        console.error(error)
        throw error
    }
}