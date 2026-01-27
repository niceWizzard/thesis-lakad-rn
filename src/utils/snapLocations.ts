import { ACCESS_TOKEN } from "../constants/token";

export const snapLocations = async ({ data, profile = 'driving-car', radius = 1500 }: {
    data: {
        coords: GeoJSON.Position;
        id: string;
    }[];
    profile?: 'driving-car';
    radius?: number;
}): Promise<GeoJSON.Position[]> => {
    const url = `https://api.openrouteservice.org/v2/snap/${profile}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': ACCESS_TOKEN,
        },
        body: JSON.stringify({
            locations: data.map(v => v.coords),
            radius
        })
    });

    const resp = await response.json();
    if (resp.error) throw new Error("Snap failed. " + resp.error.message);

    // Map back to the snapped coordinates provided by 
    return resp.locations.map((loc: any, index: number) => {
        if (loc == null) {
            throw new Error(`Snapping failed! There is no road near landmark<${JSON.stringify(data[index].id)}>`);
        }
        return loc.location;
    });
};
