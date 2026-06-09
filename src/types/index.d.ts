import { Object3D } from 'three';

export interface TextureTelemetry {
  id: string;
  name: string;
  resolution: string;
  format: string;
  sizeInBytes: number;
}

export interface AssetTelemetry {
  fileName: string;
  fileSizeRaw: number;
  fileSizeOptimised?: number;
  polyCount: number;
  verticesCount: number;
  drawCalls: number;
  materialCount: number;
  textures: TextureTelemetry[];
}

declare global {
  interface Window {
    // Reserved for future Web Worker orchestration hooks
  }
}