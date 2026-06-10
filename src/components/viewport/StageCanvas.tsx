import React, { Suspense } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls, Center, Html, Bounds, Sky } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import ModelRenderer from './ModelRenderer';
import ErrorBoundary from '../ui/ErrorBoundary';
import * as THREE from 'three';

extend(THREE);

const Loader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-3 w-48">
      <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      <span className="text-[10px] text-emerald-500 font-medium tracking-widest uppercase whitespace-nowrap">
        Engine Processing
      </span>
    </div>
  </Html>
);

export default function StageCanvas(): React.ReactElement {
  const activeModelUrl = useAppStore((state) => state.activeModelUrl);
  const optimisedModelUrl = useAppStore((state) => state.optimisedModelUrl);
  const currentRenderUrl = optimisedModelUrl || activeModelUrl;

  return (
    <div className="w-full h-full relative">
      {currentRenderUrl ? (
        <ErrorBoundary resetKey={currentRenderUrl}>
          <Canvas
            gl={{ 
              antialias: true, 
              powerPreference: "high-performance",
              toneMapping: THREE.NoToneMapping, 
              outputColorSpace: THREE.SRGBColorSpace 
            }}
            camera={{ fov: 45, near: 0.5, far: 100000 }} 
            dpr={[1, 2]}
            className="w-full h-full outline-none"
          >
            <color attach="background" args={['#202531']} />

            <Sky sunPosition={[100, 10, 100]} turbidity={0.1} rayleigh={0.01} />
            
            <ambientLight intensity={0.4} color="#ffffff" />
            <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
            
            <Suspense fallback={<Loader />}>
              <Bounds fit clip observe margin={1.2}>
                <Center>
                  <ModelRenderer url={currentRenderUrl} />
                </Center>
              </Bounds>
            </Suspense>

            <OrbitControls 
              makeDefault 
              enableDamping 
              dampingFactor={0.05}
              maxDistance={50000} 
              minDistance={0.1}
            />
          </Canvas>

          {/* ARCHITECTURAL FIX: Non-intrusive environmental lighting disclaimer */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
            <div className="bg-slate-950/80 backdrop-blur-sm border border-amber-500/30 text-amber-500/80 px-4 py-2 rounded-md shadow-lg flex items-center gap-2 max-w-lg">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[10px] font-medium tracking-wide uppercase">
                Warning: Light, shadow, and shading accuracy may vary relative to individual target engine environment settings.
              </span>
            </div>
          </div>
        </ErrorBoundary>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950 select-none">
          <p className="text-xs font-semibold tracking-widest uppercase">Viewport Context Idle</p>
        </div>
      )}
    </div>
  );
}