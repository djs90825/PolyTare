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
  
  settings: OptimisationSettings;
  heatmapModeActive: boolean;

  setSourceFile: (file: File) => void;
  setActiveModelUrl: (url: string | null) => void;
  setOptimisedAsset: (blob: Blob, url: string, metrics: OptimisedMetrics) => void;
  discardOptimisation: () => void;
  setTelemetry: (metrics: AssetTelemetry | null) => void;
  updateSettings: (modifiers: Partial<OptimisationSettings>) => void;
  setProcessingState: (isProcessing: boolean, stage: AppState['processingStage'], progress?: number) => void;
  toggleHeatmapMode: () => void;
  resetAppState: () => void;
}

const defaultSettings: OptimisationSettings = {
  meshSimplificationRatio: 1.0,
  weldVertices: true,
  compressDraco: false,
  resizeTexturesMax: 2048,
  convertTexturesToWebP: true,
};

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
  settings: defaultSettings,
  heatmapModeActive: false,

  setSourceFile: (file: File) => {
    const { activeModelUrl, optimisedModelUrl } = get();
    if (activeModelUrl) URL.revokeObjectURL(activeModelUrl);
    if (optimisedModelUrl) URL.revokeObjectURL(optimisedModelUrl);

    set({
      sourceFile: file,
      activeModelUrl: URL.createObjectURL(file),
      optimisedModelBlob: null,
      optimisedModelUrl: null,
      telemetry: null,
      optimisedMetrics: null,
    });
  },

  setActiveModelUrl: (url: string | null) => set({ activeModelUrl: url }),

  setOptimisedAsset: (blob: Blob, url: string, metrics: OptimisedMetrics) => set((state) => ({
    optimisedModelBlob: blob,
    optimisedModelUrl: url,
    optimisedMetrics: metrics,
    telemetry: state.telemetry ? { ...state.telemetry, fileSizeOptimised: blob.size } : null
  })),

  discardOptimisation: () => {
    const { optimisedModelUrl } = get();
    if (optimisedModelUrl) URL.revokeObjectURL(optimisedModelUrl);
    set((state) => ({
      optimisedModelBlob: null,
      optimisedModelUrl: null,
      optimisedMetrics: null,
      telemetry: state.telemetry ? { ...state.telemetry, fileSizeOptimised: undefined } : null
    }));
  },

  setTelemetry: (metrics: AssetTelemetry | null) => set({ telemetry: metrics }),

  updateSettings: (modifiers: Partial<OptimisationSettings>) => set((state) => ({
    settings: { ...state.settings, ...modifiers }
  })),

  setProcessingState: (isProcessing: boolean, stage: AppState['processingStage'], progress: number = 0) => set({
    isProcessing,
    processingStage: stage,
    processingProgress: progress
  }),

  toggleHeatmapMode: () => set((state) => ({ heatmapModeActive: !state.heatmapModeActive })),

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
      settings: defaultSettings,
      heatmapModeActive: false,
    });
  }
}));