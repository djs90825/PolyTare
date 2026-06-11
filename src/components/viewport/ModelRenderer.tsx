import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { Object3D, Mesh, MeshStandardMaterial, Vector3 } from 'three';

interface ModelRendererProps {
  url: string;
}

export default function ModelRenderer({ url }: ModelRendererProps): React.ReactElement | null {
  // Add an error boundary or handle loading state if needed.
  // Standard GLTF loader is used here.
  const gltf = useGLTF(url);
  const scene = gltf?.scene;
  
  const heatmapModeActive = useAppStore((state) => state.heatmapModeActive);
  const setCameraTarget = useAppStore((state) => state.setCameraTarget);

  const originalMaterialsMap = useRef<Map<string, any>>(new Map());
  const heatmapMaterialsMap = useRef<Map<string, MeshStandardMaterial>>(new Map());

  // Head detection logic
  useEffect(() => {
    if (!scene) return;
    
    let foundHead = false;
    scene.traverse((node: Object3D) => {
      if (node.name.toLowerCase().includes('head')) {
        const headPos = new Vector3();
        node.getWorldPosition(headPos);
        setCameraTarget([headPos.x, headPos.y, headPos.z]);
        foundHead = true;
      }
    });

    if (!foundHead) {
      setCameraTarget([0, 1.2, 0]);
    }
  }, [scene, setCameraTarget]);

  // Heatmap rendering logic
  useEffect(() => {
    if (!scene) return;

    scene.traverse((object: Object3D) => {
      if (object instanceof Mesh) {
        if (!originalMaterialsMap.current.has(object.uuid)) {
          originalMaterialsMap.current.set(object.uuid, object.material);
        }

        if (heatmapModeActive) {
          const vertexCount = object.geometry.attributes.position?.count || 0;
          let diagnosticColour = '#10b981'; 
          if (vertexCount > 50000) diagnosticColour = '#ef4444'; 
          else if (vertexCount > 15000) diagnosticColour = '#f59e0b';

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

  // Guard clause: Return nothing if scene hasn't loaded
  if (!scene) return null;

  return <primitive object={scene} />;
}