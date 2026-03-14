import { PlaceType, PlaceUnverifiedType } from "../model/places.types";

export const LANDMARK_TYPES = [
    'Historical',
    'Landmark',
    'Nature',
    'Religious',
    'Museum',
    'Industrial Tourism',
    'Sports & Recreation',
] satisfies PlaceType[]

export const UNVERIFIED_PLACES_TYPES = [
    'Pasalubong Center',
    'Accomodation'
] satisfies PlaceUnverifiedType[]