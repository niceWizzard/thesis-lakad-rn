import { ACCESS_TOKEN } from "../constants/token";

export const snapLocations = async ({ data, profile }: {
    data: {
        coords: [number, number];
        id: string;
    }[]; profile: string;
}) => {
    const url = `https://api.openrouteservice.org/v2/snap/${profile}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': ACCESS_TOKEN,
        },
        body: JSON.stringify({
            locations: data.map(v => v.coords),
            radius: 2000 // Look up to 5km for a road
        })
    });

    const resp = await response.json();
    if (resp.error) throw new Error("Snap failed");

    // Map back to the snapped coordinates provided by 
    return resp.locations.map((loc: any, index: number) => {
        if (loc == null) {
            throw new Error(`Snapping failed! There is no road near landmark<${JSON.stringify(data[index].id)}>`);
        }
        return loc.location;
    });
};
