import { requireNativeView } from 'expo';
import * as React from 'react';

import { AlgorithmModuleViewProps } from './AlgorithmModule.types';

const NativeView: React.ComponentType<AlgorithmModuleViewProps> =
  requireNativeView('AlgorithmModule');

export default function AlgorithmModuleView(props: AlgorithmModuleViewProps) {
  return <NativeView {...props} />;
}
