import { NativeModule, requireNativeModule } from 'expo';

import { AlgorithmModuleEvents } from './AlgorithmModule.types';

declare class AlgorithmModule extends NativeModule<AlgorithmModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;

  calculateOptimizedItinerary(data: {
    [key: string]: {
      [key: string]: number
    }
  }): Promise<string[]>

  generateItinerary(
    maxDistance: number,
    maxPOIs: number,
    weights: number[],
    pois: {
      [key: string]: {
        interest: number,
        rating: number,
      }
    },
    distanceMap: {
      [key: string]: {
        [key: string]: number
      }
    },
  ): Promise<string[]>

}

// This call loads the native module object from the JSI.
export default requireNativeModule<AlgorithmModule>('AlgorithmModule');
