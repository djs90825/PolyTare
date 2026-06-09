import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import ModelRenderer from './ModelRenderer';

export default function StageCanvas(): React.ReactElement {
  const activeModelUrl = useAppStore((state) => state.activeModelUrl);

  return (
    <div className="w-full h-full relative bg-slate-950">
      {activeModelUrl ? (
        <Canvas
          gl={{ 
            antialias: true, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: true 
          }}
          camera={{ fov: 45, position: [0, 0, 5] }}
        >
          {/* Subtle ambient lighting environment targeting zero operational cost */}
          <ambientLight intensity={0.2} />
          
          <Suspense fallback={null}>
            <Stage
              intensity={0.5}
              environment="city"
              adjustCamera={true}
              shadows={false}
            >
              <Center>
                <ModelRenderer url={activeModelUrl} />
              </Center>
            </Stage>
          </Suspense>

          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.05}
            minDistance={0.5}
            maxDistance={50}
          />
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 select-none">
          <svg className="w-12 h-12 mb-3 opacity-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <p className="text-xs font-semibold tracking-widest uppercase">Viewport Context Idle</p>
          <p className="text-[11px] text-slate-600 mt-1">Provide a .glb file to instantiate rendering</p>
        </div>
      )}
    </div>
  );
}