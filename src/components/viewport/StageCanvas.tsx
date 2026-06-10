import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import ModelRenderer from './ModelRenderer';

const Loader = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
    <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
  </div>
);

export default function StageCanvas(): React.ReactElement {
  const activeModelUrl = useAppStore((state) => state.activeModelUrl);
  const optimisedModelUrl = useAppStore((state) => state.optimisedModelUrl);
  const currentRenderUrl = optimisedModelUrl || activeModelUrl;

  return (
    <div className="w-full h-full relative bg-slate-950">
      {currentRenderUrl ? (
        <Canvas
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ fov: 45, near: 0.1, far: 1000000 }} 
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.5} />
          
          <Suspense fallback={<Loader />}>
            <Stage
              intensity={0.6}
              environment="city"
              adjustCamera={true}
              shadows={false}
            >
              <Center>
                {/* Removed the `key={currentRenderUrl}` anti-pattern. 
                  R3F manages the internal update seamlessly. Re-mounting causes lag. 
                */}
                <ModelRenderer url={currentRenderUrl} />
              </Center>
            </Stage>
          </Suspense>

          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.05}
            maxDistance={100000} 
            minDistance={0.1}
          />
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 select-none">
          <p className="text-xs font-semibold tracking-widest uppercase">Viewport Context Idle</p>
          <p className="text-[11px] text-slate-600 mt-1">Drop a .glb file to instantiate</p>
        </div>
      )}
    </div>
  );
}