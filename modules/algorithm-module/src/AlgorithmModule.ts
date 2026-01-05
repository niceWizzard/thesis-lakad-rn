import { NativeModule, requireNativeModule } from 'expo';

import { AlgorithmModuleEvents } from './AlgorithmModule.types';

declare class AlgorithmModule extends NativeModule<AlgorithmModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AlgorithmModule>('AlgorithmModule');
