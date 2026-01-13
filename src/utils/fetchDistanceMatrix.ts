const ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

const BASE_URl = 'https://api.mapbox.com/directions-matrix/v1/mapbox'

export const fetchDistanceMatrix = async ({
    waypoints,
    steps = true,
    accessToken = ACCESS_TOKEN,
    alternatives = true,
    overview = 'full',
    profile = 'driving',
}: {
    waypoints: [number, number][],
    steps?: boolean,
    alternatives?: boolean,
    accessToken?: string,
    overview?: 'full' | 'simplified' | 'false',
    profile?: 'driving' | 'walking' | 'cycling',
}): Promise<any> => {
    const coordinates = waypoints.map(v => v.join(',')).join(';');
    const url = new URL(`${BASE_URl}/${profile}/` + coordinates)
    url.searchParams.set('annotations', 'distance')
    url.searchParams.set('access_token', accessToken)
    try {
        const response = await fetch(url.toString())
        const data = await response.json()
        if (data.code !== "Ok")
            throw new Error(`Mapbox API Error code: ${data.code}. ${JSON.stringify(data, null, 2)}`)
        return data.distances
    } catch (error) {
        console.error(error)
        throw error
    }
}