import { create } from 'zustand';

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

export interface OptimisedMetrics {
  polyCount: number;
  drawCalls: number;
}

export interface OptimisationSettings {
  meshSimplificationRatio: number;
  weldVertices: boolean;
  compressDraco: boolean;
  resizeTexturesMax: 512 | 1024 | 2048 | 4096;
  convertTexturesToWebP: boolean;
}

interface AppState {
  isProcessing: boolean;
  processingProgress: number;
  processingStage: 'idle' | 'parsing' | 'optimising_geometry' | 'compressing_textures' | 'packing_draco' | 'finalising';
  
  sourceFile: File | null;
  activeModelUrl: string | null;
  optimisedModelBlob: Blob | null;
  optimisedModelUrl: string | null;
  
  telemetry: AssetTelemetry | null;
  optimisedMetrics: OptimisedMetrics | null;
  
  heatmapModeActive: boolean;
  settings: OptimisationSettings;
  
  cameraTarget: [number, number, number];

  // Actions
  setSourceFile: (file: File | null) => void;
  setProcessingState: (isProcessing: boolean, stage: AppState['processingStage'], progress?: number) => void;
  setTelemetry: (metrics: AssetTelemetry | null) => void;
  setOptimisedData: (blob: Blob, url: string, metrics: OptimisedMetrics) => void;
  updateSettings: (modifiers: Partial<OptimisationSettings>) => void;
  toggleHeatmapMode: () => void;
  discardOptimisation: () => void;
  resetAppState: () => void;
  setCameraTarget: (target: [number, number, number]) => void;
  resetCameraTarget: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isProcessing: false,
  processingProgress: 0,
  processingStage: 'idle',
  
  sourceFile: null,
  activeModelUrl: null,
  optimisedModelBlob: null,
  optimisedModelUrl: null,
  
  telemetry: null,
  optimisedMetrics: null,
  
  heatmapModeActive: false,
  settings: {
    meshSimplificationRatio: 0.5,
    weldVertices: true,
    compressDraco: true,
    resizeTexturesMax: 2048,
    convertTexturesToWebP: true,
  },
  
  cameraTarget: [0, 0, 0],

  setSourceFile: (file) => set({ sourceFile: file }),

  setProcessingState: (isProcessing, stage, progress = 0) => set({
    isProcessing,
    processingStage: stage,
    processingProgress: progress
  }),

  setTelemetry: (metrics) => set({ telemetry: metrics }),

  setOptimisedData: (blob, url, metrics) => set({
    optimisedModelBlob: blob,
    optimisedModelUrl: url,
    optimisedMetrics: metrics,
    isProcessing: false,
    processingStage: 'idle'
  }),

  updateSettings: (modifiers) => set((state) => ({
    settings: { ...state.settings, ...modifiers }
  })),

  toggleHeatmapMode: () => set((state) => ({ heatmapModeActive: !state.heatmapModeActive })),

  discardOptimisation: () => {
    const { optimisedModelUrl } = get();
    if (optimisedModelUrl) URL.revokeObjectURL(optimisedModelUrl);
    set({
      optimisedModelBlob: null,
      optimisedModelUrl: null,
      optimisedMetrics: null,
    });
  },

  resetAppState: () => {
    const { activeModelUrl, optimisedModelUrl } = get();
    if (activeModelUrl) URL.revokeObjectURL(activeModelUrl);
    if (optimisedModelUrl) URL.revokeObjectURL(optimisedModelUrl);

    set({
      isProcessing: false,
      processingProgress: 0,
      processingStage: 'idle',
      sourceFile: null,
      activeModelUrl: null,
      optimisedModelBlob: null,
      optimisedModelUrl: null,
      telemetry: null,
      optimisedMetrics: null,
      cameraTarget: [0, 0, 0],
    });
  },

  setCameraTarget: (target) => set({ cameraTarget: target }),
  
  resetCameraTarget: () => set({ cameraTarget: [0, 0, 0] }),
}));