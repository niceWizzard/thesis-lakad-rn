import { LandmarkDistrict, LandmarkMunicipality } from "../model/landmark.types";

export const DISTRICT_TO_MUNICIPALITY_MAP = {
    "1": ["Bulakan", "Calumpit", "Hagonoy", "Malolos", "Paombong", "Pulilan"],
    "2": ["Baliwag", "Bustos", "Plaridel"],
    "3": ["DRT", "San Ildefonso", "San Miguel", "San Rafael"],
    "4": ["Marilao", "Meycauayan", "Obando"],
    "5": ["Balagtas", "Bocaue", "Guiguinto", "Pandi"],
    "6": ["Angat", "Norzagaray", "Santa Maria"],
    "Lone": ["SJDM"]
} as const;


export const MUNICIPALITIES = Object.values(DISTRICT_TO_MUNICIPALITY_MAP).flat().sort() satisfies LandmarkMunicipality[]
export const DISTRICTS = Object.keys(DISTRICT_TO_MUNICIPALITY_MAP) as LandmarkDistrict[]