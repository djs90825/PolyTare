import React, { useRef, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useAssetAudit } from './hooks/useAssetAudit';
import { useWorkerQueue } from './hooks/useWorkerQueue';
import StageCanvas from './components/viewport/StageCanvas';
import { formatBytes } from './utils/fileHelpers';
import ProModal from './components/ui/ProModal';

export default function App(): React.ReactElement {
  // Initialization of hooks
  useAssetAudit();
  const { startOptimisation } = useWorkerQueue();
  
  // State orchestration
  const { 
    sourceFile, 
    setSourceFile, 
    telemetry, 
    optimisedMetrics,
    isProcessing, 
    processingStage,
    heatmapModeActive,
    toggleHeatmapMode,
    settings,
    updateSettings,
    optimisedModelUrl,
    discardOptimisation,
    resetAppState
  } = useAppStore();

  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File handling
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

  const downloadOptimisedAsset = () => {
    if (!optimisedModelUrl || !telemetry) return;
    const a = document.createElement('a');
    a.href = optimisedModelUrl;
    a.download = telemetry.fileName.replace(/\.(glb|gltf)$/i, '_polytare.glb');
    a.click();
  };

  const polyReductionPercentage = (telemetry && optimisedMetrics) 
    ? Math.round((1 - (optimisedMetrics.polyCount / telemetry.polyCount)) * 100) 
    : 0;

  const sizeReductionPercentage = (telemetry && telemetry.fileSizeOptimised) 
    ? Math.round((1 - (telemetry.fileSizeOptimised / telemetry.fileSizeRaw)) * 100) 
    : 0;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-50 font-sans overflow-hidden">
      
      {/* Sidebar Controls */}
      <aside className="w-[420px] bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl relative">
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                PolyTare
              </h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Lossless Asset Auditor</p>
            </div>
            {sourceFile && (
              <button onClick={resetAppState} className="text-xs text-slate-500 hover:text-rose-400 transition-colors font-bold uppercase tracking-wider bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800">
                Reset
              </button>
            )}
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
              
              {/* Executive Summary Report */}
              {optimisedModelUrl && telemetry && optimisedMetrics && (
                <div className="bg-emerald-950/20 p-5 rounded-xl border border-emerald-500/30 shadow-inner space-y-4">
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Optimisation Report
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Geometry Savings</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">-{polyReductionPercentage}%</div>
                      <div className="text-xs text-slate-500 mt-1">{telemetry.polyCount.toLocaleString()} ➔ {optimisedMetrics.polyCount.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Footprint Savings</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">-{sizeReductionPercentage}%</div>
                      <div className="text-xs text-slate-500 mt-1">{formatBytes(telemetry.fileSizeRaw)} ➔ {formatBytes(telemetry.fileSizeOptimised || 0)}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={downloadOptimisedAsset}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-lg shadow-lg transition-all duration-200 uppercase tracking-wider text-xs"
                    >
                      Download Asset
                    </button>
                    <button
                      onClick={discardOptimisation}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-lg transition-all duration-200 uppercase tracking-wider text-xs"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              )}

              {/* Source Diagnostic Telemetry */}
              {!optimisedModelUrl && (
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-inner">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source Diagnostics</h3>
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
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs font-medium">Extracting binary graph telemetry...</div>
                  )}
                </div>
              )}

              {/* Action Controls */}
              <button 
                onClick={toggleHeatmapMode}
                className={`w-full py-2.5 text-xs font-bold rounded-md transition-colors border ${
                  heatmapModeActive 
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {heatmapModeActive ? 'Disable Diagnostic Heatmap' : 'Visualise Density Heatmap'}
              </button>

              {/* Engine Control */}
              {!optimisedModelUrl && (
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-inner space-y-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">Decimation Parameters</h3>
                  
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-3 font-medium">
                      <span>Geometry Retention Target</span>
                      <span className="font-bold text-slate-200">{Math.round(settings.meshSimplificationRatio * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={settings.meshSimplificationRatio}
                      onChange={(e) => updateSettings({ meshSimplificationRatio: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg appearance-none h-2 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={startOptimisation}
                    disabled={isProcessing || !telemetry}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black py-3.5 px-4 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                  >
                    {isProcessing ? 'Executing WASM Pipeline...' : 'Run Engine'}
                  </button>
                </div>
              )}

              {/* Pro Section */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-bold text-white mb-1">PolyTare Pro</h4>
                  <p className="text-[10px] text-slate-400 mb-3">Scale your pipeline with batch processing and CI/CD tools.</p>
                  <button 
                    onClick={() => setIsProModalOpen(true)}
                    className="w-full py-2 bg-emerald-500/10 border border-emerald-500 text-emerald-400 text-xs font-bold rounded hover:bg-emerald-500 hover:text-slate-950 transition-all"
                  >
                    Pro Version Coming Soon (£29.99/mo)
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </aside>

      {/* Viewport (Removed Error Boundary for now) */}
      <main className="flex-1 relative bg-[#020617] shadow-inner shadow-black/50">
        <StageCanvas />
      </main>

      {/* Global Modals */}
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </div>
  );
}