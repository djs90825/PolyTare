import { WebIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

interface OptimisationPayload {
  fileBuffer: ArrayBuffer;
  settings: {
    meshSimplificationRatio: number;
    weldVertices: boolean;
  };
}

// Enforce strict typing for the isolated background thread scope
const _self = self as unknown as Worker;

_self.onmessage = async (event: MessageEvent<OptimisationPayload>) => {
  try {
    const { fileBuffer, settings } = event.data;

    _self.postMessage({ status: 'progress', stage: 'parsing', progress: 10 });

    await MeshoptSimplifier.ready;

    const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
    const document = await io.readBinary(new Uint8Array(fileBuffer));

    _self.postMessage({ status: 'progress', stage: 'optimising_geometry', progress: 40 });

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

    _self.postMessage({ status: 'progress', stage: 'finalising', progress: 90 });

    const glbUint8Array = await io.writeBinary(document);
    const optimisedBlob = new Blob([glbUint8Array], { type: 'model/gltf-binary' });

    _self.postMessage({ status: 'complete', blob: optimisedBlob });
  } catch (error: any) {
    _self.postMessage({ status: 'error', error: error.message || 'Unknown WASM Pipeline Error' });
  }
};