import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import ModelRenderer from './ModelRenderer';

export default function StageCanvas(): React.ReactElement {
  const activeModelUrl = useAppStore((state) => state.activeModelUrl);
  const optimisedModelUrl = useAppStore((state) => state.optimisedModelUrl);
  const currentRenderUrl = optimisedModelUrl || activeModelUrl;

  return (
    <div className="w-full h-full relative bg-slate-950">
      {currentRenderUrl ? (
        <Canvas
          gl={{ antialias: true, powerPreference: "high-performance" }}
          // We set a massive clipping distance to ensure nothing is ever "clipped" out
          camera={{ fov: 45, near: 0.1, far: 1000000 }} 
          dpr={[1, 2]} // Support high-density retina displays
        >
          <ambientLight intensity={0.5} />
          
          <Suspense fallback={null}>
            {/* Stage auto-adjusts the camera to fit the model.
              We disable shadows to save compute resources for large architectural models.
            */}
            <Stage
              intensity={0.6}
              environment="city"
              adjustCamera={true}
              shadows={false}
            >
              <Center>
                <ModelRenderer key={currentRenderUrl} url={currentRenderUrl} />
              </Center>
            </Stage>
          </Suspense>

          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.05}
            // Allow the user to zoom out to the horizon if the model is massive
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