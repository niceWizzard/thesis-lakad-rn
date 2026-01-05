import * as React from 'react';

import { AlgorithmModuleViewProps } from './AlgorithmModule.types';

export default function AlgorithmModuleView(props: AlgorithmModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
