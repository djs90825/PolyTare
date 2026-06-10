import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { Object3D, Mesh, MeshStandardMaterial } from 'three';

interface ModelRendererProps {
  url: string;
}

export default function ModelRenderer({ url }: ModelRendererProps): React.ReactElement {
  // Fetch the scene graph using Drei's cached GLTF loader
  const { scene } = useGLTF(url);
  const heatmapModeActive = useAppStore((state) => state.heatmapModeActive);

  // Maintain references to backup original materials and track custom ones for disposal
  const originalMaterialsMap = useRef<Map<string, any>>(new Map());
  const heatmapMaterialsMap = useRef<Map<string, MeshStandardMaterial>>(new Map());

  useEffect(() => {
    if (!scene) return;

    // Cache original materials before applying any visual debug overrides
    scene.traverse((object: Object3D) => {
      if (object instanceof Mesh) {
        if (!originalMaterialsMap.current.has(object.uuid)) {
          originalMaterialsMap.current.set(object.uuid, object.material);
        }

        if (heatmapModeActive) {
          // Calculate a proxy vertex density representation for visual debugging
          const geometry = object.geometry;
          const vertexCount = geometry.attributes.position ? geometry.attributes.position.count : 0;
          
          // Apply contrasting heatmap diagnostic colours based on relative complexity
          let diagnosticColour = '#10b981'; // Green (Optimised)
          if (vertexCount > 50000) diagnosticColour = '#ef4444'; // Red (Critical)
          else if (vertexCount > 15000) diagnosticColour = '#f59e0b'; // Amber (Moderate)

          // Reuse existing heatmap material if previously generated to save GPU memory
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
          // Revert back to original look when Heatmap mode is turned off
          const originalMaterial = originalMaterialsMap.current.get(object.uuid);
          if (originalMaterial) {
            object.material = originalMaterial;
          }
        }
      }
    });
  }, [scene, heatmapModeActive]);

  // Clean up cache allocations and strictly dispose of custom materials to prevent GPU leaks
  useEffect(() => {
    return () => {
      originalMaterialsMap.current.clear();
      heatmapMaterialsMap.current.forEach((material) => material.dispose());
      heatmapMaterialsMap.current.clear();
    };
  }, [url]);

  return <primitive object={scene} dispose={null} />;
}