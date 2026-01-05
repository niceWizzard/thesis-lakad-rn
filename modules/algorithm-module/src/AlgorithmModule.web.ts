import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './AlgorithmModule.types';

type AlgorithmModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class AlgorithmModule extends NativeModule<AlgorithmModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(AlgorithmModule, 'AlgorithmModule');
