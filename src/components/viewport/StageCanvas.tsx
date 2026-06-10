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
  const cameraTarget = useAppStore((state) => state.cameraTarget);
  
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
            camera={{ fov: 45, near: 0.1, far: 100000 }} 
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
              target={new THREE.Vector3(...cameraTarget)}
              enableDamping 
              dampingFactor={0.05}
              maxDistance={50000} 
              minDistance={0.1}
            />
          </Canvas>

          {/* Lighting/Disclaimer warning */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
            <div className="bg-slate-950/80 backdrop-blur-sm border border-amber-500/30 text-amber-500/80 px-4 py-2 rounded-md shadow-lg flex items-center gap-2 max-w-lg">
              <span className="text-[10px] font-medium tracking-wide uppercase">
                WARNING: Light, shadow, and shading may not appear as they do in your development due to individual project settings.
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