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

export interface OptimisationSettings {
  meshSimplificationRatio: number; // 0.0 to 1.0 (e.g., 0.5 means reduce vertices by 50%)
  weldVertices: boolean;
  compressDraco: boolean;
  resizeTexturesMax: 512 | 1024 | 2048 | 4096;
  convertTexturesToWebP: boolean;
}

interface AppState {
  // Loading and Process Lifecycle States
  isProcessing: boolean;
  processingProgress: number;
  processingStage: 'idle' | 'parsing' | 'optimising_geometry' | 'compressing_textures' | 'packing_draco' | 'finalising';
  
  // Active File Ingestion Blobs
  sourceFile: File | null;
  activeModelUrl: string | null;
  optimisedModelBlob: Blob | null;
  optimisedModelUrl: string | null;
  
  // Analytical Metrics
  telemetry: AssetTelemetry | null;
  
  // Pipeline Modifiers
  settings: OptimisationSettings;
  
  // Viewport Settings
  heatmapModeActive: boolean;

  // Actions / State Mutations
  setSourceFile: (file: File) => void;
  setActiveModelUrl: (url: string | null) => void;
  setOptimisedAsset: (blob: Blob, url: string) => void;
  setTelemetry: (metrics: AssetTelemetry | null) => void;
  updateSettings: (modifiers: Partial<OptimisationSettings>) => void;
  setProcessingState: (isProcessing: boolean, stage: AppState['processingStage'], progress?: number) => void;
  toggleHeatmapMode: () => void;
  resetAppState: () => void;
}

const defaultSettings: OptimisationSettings = {
  meshSimplificationRatio: 1.0, // Retain 100% geometry by default
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
  settings: defaultSettings,
  heatmapModeActive: false,

  setSourceFile: (file: File) => {
    // Prevent memory leaks by cleaning up older object URLs prior to establishing new file references
    const currentUrl = get().activeModelUrl;
    const currentOptimisedUrl = get().optimisedModelUrl;
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    if (currentOptimisedUrl) URL.revokeObjectURL(currentOptimisedUrl);

    set({
      sourceFile: file,
      activeModelUrl: URL.createObjectURL(file),
      optimisedModelBlob: null,
      optimisedModelUrl: null,
      telemetry: null,
    });
  },

  setActiveModelUrl: (url: string | null) => set({ activeModelUrl: url }),

  setOptimisedAsset: (blob: Blob, url: string) => set((state) => ({
    optimisedModelBlob: blob,
    optimisedModelUrl: url,
    telemetry: state.telemetry ? { ...state.telemetry, fileSizeOptimised: blob.size } : null
  })),

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
      settings: defaultSettings,
      heatmapModeActive: false,
    });
  }
}));