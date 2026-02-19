import { z } from "zod";
import { DISTRICT_TO_MUNICIPALITY_MAP, DISTRICTS, MUNICIPALITIES } from "../constants/jurisdictions";
import { LANDMARK_TYPES } from "../constants/type";
import { LandmarkDistrict } from "../model/landmark.types";

export const createAndEditLandmarkSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    type: z.enum(LANDMARK_TYPES, "Select at least one category"),
    district: z.enum(DISTRICTS, "Please select a valid district"),
    municipality: z.enum(MUNICIPALITIES, "Please select a valid municipality"),
    description: z.string().min(10, "Description must be at least 10 characters"),

    // Latitude: -90 to 90
    latitude: z.string()
        .regex(/^-?\d*\.?\d*$/, "Must be a valid number")
        .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num >= -90 && num <= 90;
        }, "Latitude must be between -90 and 90"),

    // Longitude: -180 to 180
    longitude: z.string()
        .regex(/^-?\d*\.?\d*$/, "Must be a valid number")
        .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num >= -180 && num <= 180;
        }, "Longitude must be between -180 and 180"),

    gmaps_rating: z.string()
        .optional()
        .refine(val => !val || /^\d*\.?\d*$/.test(val), "Rating must be a valid number")
        .refine(val => {
            if (!val) return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0 && num <= 5;
        }, "Rating must be between 0 and 5"),
    externalImageUrl: z.url({ message: "Please enter a valid URL (include http://)" })
        .optional()
        .or(z.literal('')),
    opening_hours: z.array(z.object({
        day_of_week: z.number().min(0).max(6), // 0=Sunday, 6=Saturday
        opens_at: z.date().optional(),
        closes_at: z.date().optional(),
        is_closed: z.boolean(),
    })).optional(),
}).superRefine((data, ctx) => {
    const validMunicipalities = DISTRICT_TO_MUNICIPALITY_MAP[data.district as LandmarkDistrict] as readonly string[];
    if (!validMunicipalities.includes(data.municipality)) {
        ctx.addIssue({
            code: 'custom',
            message: `Municipality must be within District ${data.district}`,
            path: ["municipality"],
        });
    }
});