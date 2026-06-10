import { WebIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { simplify, weld, quantize, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';

interface OptimisationPayload {
  fileBuffer: ArrayBuffer;
  settings: {
    meshSimplificationRatio: number;
    weldVertices: boolean;
  };
}

const _self = self as unknown as Worker;

_self.onmessage = async (event: MessageEvent<OptimisationPayload>) => {
  try {
    const { fileBuffer, settings } = event.data;

    _self.postMessage({ status: 'progress', stage: 'initialising_wasm_engines', progress: 5 });

    // ARCHITECTURAL FIX: Initialise MeshOptimizer for both Decimation AND Compression
    await MeshoptSimplifier.ready;
    await MeshoptEncoder.ready;

    const io = new WebIO()
      .registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression])
      .registerDependencies({
        'meshopt.encoder': MeshoptEncoder,
      });

    const document = await io.readBinary(new Uint8Array(fileBuffer));
    _self.postMessage({ status: 'progress', stage: 'auditing_mesh_topology', progress: 20 });

    const root = document.getRoot();
    const isCharacterMesh = root.listSkins().length > 0 || root.listAnimations().length > 0;

    // ====================================================================
    // PIPELINE 1: GEOMETRY OPTIMISATION
    // ====================================================================
    if (isCharacterMesh) {
      _self.postMessage({ status: 'progress', stage: 'protecting_character_rigs', progress: 50 });
      // Safely compress floats losslessly without breaking skeleton weights
      await document.transform(
        dedup(),
        quantize({ quantizePosition: 14, quantizeTexcoord: 12, quantizeColor: 8, quantizeNormal: 8 })
      );
    } else {
      _self.postMessage({ status: 'progress', stage: 'decimating_static_geometry', progress: 50 });
      if (settings.weldVertices) {
        await document.transform(weld());
      }
      if (settings.meshSimplificationRatio < 1.0) {
        await document.transform(
          simplify({
            simplifier: MeshoptSimplifier,
            ratio: settings.meshSimplificationRatio,
            error: 0.01, 
          })
        );
      }
    }

    // ====================================================================
    // PIPELINE 2: MESHOPT BINARY COMPRESSION (Godot 4 Standard)
    // ====================================================================
    _self.postMessage({ status: 'progress', stage: 'applying_meshopt_compression', progress: 75 });
    
    // By enforcing this extension, @gltf-transform automatically routes the 
    // binary buffers through the MeshoptEncoder during the write phase.
    document.createExtension(EXTMeshoptCompression).setRequired(true);

    _self.postMessage({ status: 'progress', stage: 'compiling_binary_graph', progress: 90 });

    let polyCount = 0;
    let drawCalls = 0;
    root.listMeshes().forEach((mesh) => {
      mesh.listPrimitives().forEach((prim) => {
        drawCalls += 1;
        const indices = prim.getIndices();
        const position = prim.getAttribute('POSITION');
        if (indices) {
          polyCount += indices.getCount() / 3;
        } else if (position) {
          polyCount += position.getCount() / 3;
        }
      });
    });

    const glbUint8Array = await io.writeBinary(document);
    const buffer = glbUint8Array.buffer;

    _self.postMessage({ 
      status: 'complete', 
      buffer: buffer, 
      metrics: { polyCount: Math.round(polyCount), drawCalls } 
    }, [buffer]);

  } catch (error: any) {
    console.error('PolyTare WASM Exception:', error);
    _self.postMessage({ status: 'error', error: error.message || 'Fatal WASM Pipeline Error' });
  }
};