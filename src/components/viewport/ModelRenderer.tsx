import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { Object3D, Mesh, MeshStandardMaterial } from 'three';

interface ModelRendererProps {
  url: string;
}

export default function ModelRenderer({ url }: ModelRendererProps): React.ReactElement {
  // Inject Draco decoder path explicitly. Essential for reading compressed source assets.
  const { scene } = useGLTF(url, 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  const heatmapModeActive = useAppStore((state) => state.heatmapModeActive);

  // Maintain references to backup original materials and track custom ones for disposal
  const originalMaterialsMap = useRef<Map<string, any>>(new Map());
  const heatmapMaterialsMap = useRef<Map<string, MeshStandardMaterial>>(new Map());

  useEffect(() => {
    if (!scene) return;

    scene.traverse((object: Object3D) => {
      if (object instanceof Mesh) {
        if (!originalMaterialsMap.current.has(object.uuid)) {
          originalMaterialsMap.current.set(object.uuid, object.material);
        }

        if (heatmapModeActive) {
          const geometry = object.geometry;
          const vertexCount = geometry.attributes.position ? geometry.attributes.position.count : 0;
          
          let diagnosticColour = '#10b981'; // Green (Optimised)
          if (vertexCount > 50000) diagnosticColour = '#ef4444'; // Red (Critical)
          else if (vertexCount > 15000) diagnosticColour = '#f59e0b'; // Amber (Moderate)

          let hmMaterial = heatmapMaterialsMap.current.get(object.uuid);
          if (!hmMaterial) {
            hmMaterial = new MeshStandardMaterial({
              color: diagnosticColour,
              wireframe: true,
              roughness: 0.4,
              metalness: 0.1
            });
            heatmapMaterialsMap.current.set(object.uuid, hmMaterial);
          }

          object.material = hmMaterial;
        } else {
          const originalMaterial = originalMaterialsMap.current.get(object.uuid);
          if (originalMaterial) {
            object.material = originalMaterial;
          }
        }
      }
    });
  }, [scene, heatmapModeActive]);

  useEffect(() => {
    return () => {
      originalMaterialsMap.current.clear();
      heatmapMaterialsMap.current.forEach((material) => material.dispose());
      heatmapMaterialsMap.current.clear();
    };
  }, [url]);

  return <primitive object={scene} dispose={null} />;
}