import { create } from "zustand";
import { Landmark } from "../model/landmark.types";





export interface LandmarkStore {
    landmarks: Landmark[],
    setLandmarks: (landmarks: Landmark[]) => void,
}

export const useLandmarkStore = create<LandmarkStore>((set, get) => ({
    landmarks: [],
    setLandmarks: (landmarks) => {
        set({
            landmarks: [...landmarks]
        })
    }
}))
