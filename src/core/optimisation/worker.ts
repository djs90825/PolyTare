import { WebIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

// Define strict typing for incoming worker payloads
interface OptimisationPayload {
  fileBuffer: ArrayBuffer;
  settings: {
    meshSimplificationRatio: number;
    weldVertices: boolean;
  };
}

self.onmessage = async (event: MessageEvent<OptimisationPayload>) => {
  try {
    const { fileBuffer, settings } = event.data;

    // Report back to the main thread that the WASM sequence has begun
    self.postMessage({ status: 'progress', stage: 'parsing', progress: 10 });

    // Initialise WebAssembly bindings prior to graph traversal
    await MeshoptSimplifier.ready;

    const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
    const document = await io.readBinary(new Uint8Array(fileBuffer));

    self.postMessage({ status: 'progress', stage: 'optimising_geometry', progress: 40 });

    // Step 1: Weld coincident vertices to clean up topological errors and reduce array bulk
    if (settings.weldVertices) {
      await document.transform(weld());
    }

    // Step 2: Execute non-destructive edge-collapse decimation
    if (settings.meshSimplificationRatio < 1.0) {
      await document.transform(
        simplify({
          simplifier: MeshoptSimplifier,
          ratio: settings.meshSimplificationRatio,
          error: 0.01, // Error threshold to prevent severe visual artifacting
        })
      );
    }

    self.postMessage({ status: 'progress', stage: 'finalising', progress: 90 });

    // Step 3: Repackage the document into a strict GLB binary stream
    const glbUint8Array = await io.writeBinary(document);
    
    // Create an isolated blob reference to pass back to the UI
    const optimisedBlob = new Blob([glbUint8Array], { type: 'model/gltf-binary' });

    self.postMessage({ status: 'complete', blob: optimisedBlob });
  } catch (error: any) {
    self.postMessage({ status: 'error', error: error.message || 'Unknown WASM Pipeline Error' });
  }
};