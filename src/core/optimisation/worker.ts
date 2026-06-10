import { WebIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld, quantize, dedup, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';

interface OptimisationPayload {
  fileBuffer: ArrayBuffer;
  settings: {
    meshSimplificationRatio: number;
    weldVertices: boolean;
    useDraco?: boolean;
  };
}

const _self = self as unknown as Worker;

// ARCHITECTURAL FIX: Watchdog Timer
// Prevents the worker thread from silently hanging if WASM binaries fail to load.
const initWasmWithWatchdog = async <T>(name: string, initPromise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    initPromise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`[Watchdog] ${name} WASM binary resolution timed out.`)), timeoutMs)
    )
  ]);
};

_self.onmessage = async (event: MessageEvent<OptimisationPayload>) => {
  try {
    const { fileBuffer, settings } = event.data;
    let dracoSupported = false;
    let decoderModule, encoderModule;

    _self.postMessage({ status: 'progress', stage: 'initialising_wasm_engines', progress: 5 });

    // 1. Safe MeshOpt Initialisation
    try {
      await initWasmWithWatchdog('MeshOpt', MeshoptSimplifier.ready);
    } catch (e) {
      throw new Error("Critical Failure: Base Meshoptimizer WASM failed to load. Engine halted.");
    }

    // 2. Defensive Draco Initialisation
    // We explicitly point to the root where we placed the WASM files in Step 1.
    try {
      _self.postMessage({ status: 'progress', stage: 'mounting_draco_binaries', progress: 10 });
      
      decoderModule = await initWasmWithWatchdog('DracoDecoder', draco3d.createDecoderModule({
        locateFile: (file: string) => `/${file}`
      }));
      
      encoderModule = await initWasmWithWatchdog('DracoEncoder', draco3d.createEncoderModule({
        locateFile: (file: string) => `/${file}`
      }));

      dracoSupported = true;
    } catch (e) {
      console.warn("PolyTare Fallback: Draco WASM unavailable. Reverting to standard compression.", e);
      _self.postMessage({ status: 'progress', stage: 'draco_failed_using_fallback_pipeline', progress: 10 });
      dracoSupported = false;
    }

    // 3. IO Configuration
    const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
    if (dracoSupported && decoderModule && encoderModule) {
      io.registerDependencies({
        'draco3d.decoder': decoderModule,
        'draco3d.encoder': encoderModule,
      });
    }

    const document = await io.readBinary(new Uint8Array(fileBuffer));
    _self.postMessage({ status: 'progress', stage: 'auditing_mesh_topology', progress: 20 });

    const root = document.getRoot();
    const isCharacterMesh = root.listSkins().length > 0 || root.listAnimations().length > 0;

    // ====================================================================
    // PIPELINE 1: GEOMETRY OPTIMISATION
    // ====================================================================
    if (isCharacterMesh) {
      _self.postMessage({ status: 'progress', stage: 'protecting_character_rigs', progress: 50 });
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
    // PIPELINE 2: CONDITIONAL DRACO ENCODING
    // ====================================================================
    if (dracoSupported && settings.useDraco !== false) {
      _self.postMessage({ status: 'progress', stage: 'applying_draco_encoding', progress: 75 });
      document.createExtension(KHRONOS_EXTENSIONS.KHR_DRACO_MESH_COMPRESSION).setRequired(true);
      await document.transform(
        draco({
          quantizePosition: 14,
          quantizeTexcoord: 12,
          quantizeNormal: 10,
          quantizeColor: 8,
          quantizeGeneric: 12,
        })
      );
    } else {
      _self.postMessage({ status: 'progress', stage: 'finalising_standard_payload', progress: 75 });
    }

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