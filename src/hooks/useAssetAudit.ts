import { useEffect, useRef } from 'react';
import { WebIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { useAppStore, AssetTelemetry, TextureTelemetry } from '../store/useAppStore';

export function useAssetAudit(): void {
  const sourceFile = useAppStore((state) => state.sourceFile);
  const setTelemetry = useAppStore((state) => state.setTelemetry);
  const setProcessingState = useAppStore((state) => state.setProcessingState);
  
  // Prevent duplicate audit runs on strict mode remounts
  const processedFileRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sourceFile) {
      processedFileRef.current = null;
      return;
    }

    // Skip if we already processed this exact file instance
    if (processedFileRef.current === sourceFile.name + sourceFile.size) return;
    processedFileRef.current = sourceFile.name + sourceFile.size;

    const auditAsset = async () => {
      setProcessingState(true, 'parsing', 0);
      
      try {
        const arrayBuffer = await sourceFile.arrayBuffer();
        
        const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
        const document = await io.readBinary(new Uint8Array(arrayBuffer));
        
        const root = document.getRoot();
        const meshes = root.listMeshes();
        const materials = root.listMaterials();
        const textures = root.listTextures();

        let polyCount = 0;
        let verticesCount = 0;
        let drawCalls = 0;

        meshes.forEach((mesh) => {
          mesh.listPrimitives().forEach((prim) => {
            drawCalls += 1;
            const indices = prim.getIndices();
            const position = prim.getAttribute('POSITION');
            
            if (indices) {
              polyCount += indices.getCount() / 3;
            } else if (position) {
              polyCount += position.getCount() / 3;
            }

            if (position) {
              verticesCount += position.getCount();
            }
          });
        });

        const textureTelemetry: TextureTelemetry[] = textures.map((tex) => {
          const image = tex.getImage();
          const size = image ? image.byteLength : 0;
          const mimeType = tex.getMimeType() || 'unknown';
          const sizeInPixels = tex.getSize();
          const res = sizeInPixels ? `${sizeInPixels[0]}x${sizeInPixels[1]}` : 'Unknown';

          return {
            id: tex.getURI() || Math.random().toString(36).substring(7),
            name: tex.getName() || 'Unnamed Texture',
            resolution: res,
            format: mimeType,
            sizeInBytes: size
          };
        });

        const telemetry: AssetTelemetry = {
          fileName: sourceFile.name,
          fileSizeRaw: sourceFile.size,
          polyCount: Math.round(polyCount),
          verticesCount,
          drawCalls,
          materialCount: materials.length,
          textures: textureTelemetry
        };

        setTelemetry(telemetry);
      } catch (error) {
        console.error("PolyTare Architecture Error: Failed to parse GLTF binary stream.", error);
      } finally {
        setProcessingState(false, 'idle', 100);
      }
    };

    auditAsset();
  }, [sourceFile, setTelemetry, setProcessingState]);
}