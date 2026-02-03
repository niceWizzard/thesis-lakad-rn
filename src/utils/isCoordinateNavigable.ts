import { snapLocations } from "./snapLocations";

export const isCoordinateNavigable = async (location: GeoJSON.Position) => {
    try {
        await snapLocations({
            data: [{
                coords: location,
                id: "test"
            }]
        })
        return true;
    } catch {
        return false;
    }
}   