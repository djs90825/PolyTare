import React, { useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import { useAssetAudit } from './hooks/useAssetAudit';
import StageCanvas from './components/viewport/StageCanvas';
import { formatBytes } from './utils/fileHelpers';

export default function App(): React.ReactElement {
  // Initialise background listeners
  useAssetAudit();
  
  const { 
    sourceFile, 
    setSourceFile, 
    telemetry, 
    isProcessing, 
    processingStage,
    heatmapModeActive,
    toggleHeatmapMode
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    let file: File | null = null;
    
    if ('dataTransfer' in event && event.dataTransfer) {
      file = event.dataTransfer.files[0];
    } else if (event.target && 'files' in event.target && (event.target as HTMLInputElement).files) {
      file = (event.target as HTMLInputElement).files![0];
    }

    if (file && file.name.match(/\.(gltf|glb)$/i)) {
      setSourceFile(file);
    } else {
      alert('Strict execution: Only .gltf or .glb file formats are supported.');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Structural Sidebar Controls */}
      <aside className="w-96 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between z-10 shadow-2xl">
        <div>
          <header className="mb-8">
            <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              PolyTare
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Lossless Asset Auditor</p>
          </header>

          {!sourceFile ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/50 p-10 rounded-xl text-center cursor-pointer transition-all duration-200 group"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileDrop} className="hidden" accept=".gltf,.glb" />
              <span className="block text-sm font-bold text-slate-300 group-hover:text-emerald-400 mb-2">
                Drop 3D Asset Context Here
              </span>
              <span className="text-xs text-slate-500 font-medium">.GLB or .GLTF (Max 200MB)</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Telemetry Display */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asset Diagnostics</h3>
                  {isProcessing && <span className="text-xs text-emerald-400 animate-pulse font-medium">{processingStage}...</span>}
                </div>
                
                {telemetry ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Source File</div>
                      <div className="text-sm font-medium truncate" title={telemetry.fileName}>{telemetry.fileName}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/50">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Geometry</div>
                        <div className="text-lg font-black text-slate-200 mt-1">{telemetry.polyCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">tris</span></div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/50">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Draw Calls</div>
                        <div className="text-lg font-black text-amber-400 mt-1">{telemetry.drawCalls}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800/50">
                       <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Source Weight</div>
                       <div className="text-sm font-black text-slate-200">{formatBytes(telemetry.fileSizeRaw)}</div>
                    </div>

                    <button 
                      onClick={toggleHeatmapMode}
                      className={`w-full py-2 text-xs font-bold rounded-md transition-colors border ${
                        heatmapModeActive 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {heatmapModeActive ? 'Disable Diagnostic Heatmap' : 'Visualise Density Heatmap'}
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-medium">Extracting binary graph telemetry...</div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-[10px] text-slate-600 font-medium uppercase tracking-widest">
          Client-Side WASM Execution Engine
        </footer>
      </aside>

      {/* R3F High-Performance Viewport */}
      <main className="flex-1 relative bg-[#020617] shadow-inner shadow-black/50">
        <StageCanvas />
      </main>
    </div>
  );
}