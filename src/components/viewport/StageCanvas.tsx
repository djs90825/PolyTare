import React, { Suspense } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls, Center, Html, Bounds, Environment } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import ModelRenderer from './ModelRenderer';
import ErrorBoundary from '../ui/ErrorBoundary';
import * as THREE from 'three';

// Explicitly ensure Three namespace is bridged for R3F reconciliation
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
              // ARCHITECTURAL FIX: Exact Godot 4 Tone Mapping and Colour Space Parity
              toneMapping: THREE.ACESFilmicToneMapping, 
              toneMappingExposure: 1.0,
              outputColorSpace: THREE.SRGBColorSpace 
            }}
            camera={{ fov: 45, near: 0.1, far: 100000 }} 
            dpr={[1, 2]}
            className="w-full h-full outline-none"
          >
            {/* ARCHITECTURAL FIX: Godot 4 Default Inspector Background Colour */}
            <color attach="background" args={['#202531']} />

            {/* Godot Parity Lighting Stack:
              - A flat ambient light to lift shadows neutrally.
              - A single directional sun positioned precisely where Godot places its default key light.
            */}
            <ambientLight color="#ffffff" intensity={0.4} />
            <directionalLight position={[-5, 5, 5]} intensity={1.2} color="#ffffff" castShadow={false} />
            
            {/* ARCHITECTURAL FIX: HDRI Throttling
              We use "city" as it mimics Godot's procedural sky (blue/grey gradients), 
              but we drastically throttle the intensity. It will now only calculate 
              PBR reflections (metals/roughness) without painting its own light onto the model.
            */}
            <Environment preset="city" environmentIntensity={0.15} />
            
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
        </ErrorBoundary>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950 select-none">
          <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-xs font-semibold tracking-widest uppercase">Viewport Context Idle</p>
          <p className="text-[11px] text-slate-600 mt-1">Drop a .glb file to instantiate</p>
        </div>
      )}
    </div>
  );
}