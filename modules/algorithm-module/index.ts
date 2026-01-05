// Reexport the native module. On web, it will be resolved to AlgorithmModule.web.ts
// and on native platforms to AlgorithmModule.ts
export { default } from './src/AlgorithmModule';
export { default as AlgorithmModuleView } from './src/AlgorithmModuleView';
export * from  './src/AlgorithmModule.types';
