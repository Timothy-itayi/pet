import { Box3, Vector3, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Low-poly furniture from Kenney's Furniture Kit (CC0), in public/models. */
export const MODELS = [
  'desk', 'chairDesk', 'books', 'pottedPlant',
  'sideTableDrawers', 'televisionVintage', 'trashcan', 'cardboardBoxClosed', 'radio', 'speakerSmall',
] as const;
export type ModelName = (typeof MODELS)[number];

const loader = new GLTFLoader();
const cache = new Map<ModelName, Promise<Object3D>>();

/** A fresh copy of a model. Each one is downloaded once. */
export async function model(name: ModelName): Promise<Object3D> {
  let loading = cache.get(name);
  if (!loading) {
    loading = loader.loadAsync(`${import.meta.env.BASE_URL}models/${name}.glb`).then((gltf) => gltf.scene);
    cache.set(name, loading);
  }
  return (await loading).clone(true);
}

/** Width, height and depth of something, plus its lowest corner. */
export function sizeOf(object: Object3D): { size: Vector3; min: Vector3 } {
  const box = new Box3().setFromObject(object);
  return { size: box.getSize(new Vector3()), min: box.min.clone() };
}
