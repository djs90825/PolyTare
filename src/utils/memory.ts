import { Object3D, Mesh, Texture, Material } from 'three';

/**
 * Traverses a Three.js node structure and disposes of all bound geometries, materials, and textures
 * to completely eliminate client-side WebGL GPU memory leaks.
 */
export function purgeSceneGraph(rootNode: Object3D): void {
    rootNode.traverse((object: Object3D) => {
        if (!(object instanceof Mesh)) return;

        // Dispose Geometry
        if (object.geometry) {
            object.geometry.dispose();
        }

        // Dispose Materials
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach((mat) => disposeMaterialProps(mat));
            } else {
                disposeMaterialProps(object.material);
            }
        }
    });
}

function disposeMaterialProps(material: Material): void {
    material.dispose();

    // Iterate over properties to look for active web textures mapping data
    for (const key of Object.keys(material)) {
        const value = (material as any)[key];
        if (value && value instanceof Texture) {
            value.dispose();
        }
    }
}