import { MapboxRoute } from "@/src/utils/navigation/fetchDirections";

export const route = [
    {
        "weight_name": "auto",
        "weight": 22.786,
        "duration": 22.786,
        "distance": 114.153,
        "legs": [
            {
                "weight": 22.786,
                "duration": 22.786,
                "steps": [
                    {
                        "intersections": [
                            {
                                "entry": [true],
                                "bearings": [0],
                                "duration": 11.34,
                                "mapbox_streets_v8": { "class": "street" },
                                "is_urban": true,
                                "admin_index": 0,
                                "out": 0,
                                "weight": 11.34,
                                "geometry_index": 0,
                                "location": [-73.900338, 40.7182]
                            },
                            {
                                "bearings": [176, 348],
                                "entry": [false, true],
                                "in": 0,
                                "mapbox_streets_v8": { "class": "street" },
                                "is_urban": true,
                                "admin_index": 0,
                                "out": 1,
                                "geometry_index": 2,
                                "location": [-73.900347, 40.71871]
                            }
                        ],
                        "maneuver": {
                            "type": "depart",
                            "instruction": "Drive north on 64th Street.",
                            "bearing_after": 0,
                            "bearing_before": 0,
                            "location": [-73.900338, 40.7182]
                        },
                        "name": "64th Street",
                        "duration": 22.786,
                        "distance": 114.153,
                        "driving_side": "right",
                        "weight": 22.786,
                        "mode": "driving",
                        "geometry": {
                            "coordinates": [
                                [-73.900338, 40.7182],
                                [-73.900335, 40.718669],
                                [-73.900347, 40.71871],
                                [-73.90049, 40.719213]
                            ],
                            "type": "LineString"
                        }
                    },
                    {
                        "maneuver": {
                            "type": "arrive",
                            "instruction": "You have arrived at your destination.",
                            "bearing_after": 0,
                            "bearing_before": 348,
                            "location": [-73.90049, 40.719213]
                        },
                        "name": "64th Street",
                        "duration": 0,
                        "distance": 0,
                        "driving_side": "right",
                        "weight": 0,
                        "mode": "driving",
                        "geometry": {
                            "coordinates": [[-73.90049, 40.719213], [-73.90049, 40.719213]],
                            "type": "LineString"
                        }
                    }
                ],
                "distance": 114.153,
                "summary": "64th Street"
            }
        ],
        "geometry": {
            "coordinates": [
                [-73.900338, 40.7182],
                [-73.900335, 40.718669],
                [-73.900347, 40.71871],
                [-73.90049, 40.719213]
            ],
            "type": "LineString"
        }
    }
] as MapboxRoute[]