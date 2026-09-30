import { BufferGeometry, Material, Texture } from 'three'
import type { Object3D } from 'three'

export function disposeModel(root: Object3D) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  root.traverse((object) => {
    if ('geometry' in object && object.geometry instanceof BufferGeometry) geometries.add(object.geometry)
    if ('material' in object) {
      const attached: unknown = object.material
      const items: unknown[] = Array.isArray(attached) ? attached : [attached]
      for (const material of items) {
        if (!(material instanceof Material)) continue
        materials.add(material)
        for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value)
      }
    }
  })
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
  for (const texture of textures) {
    const bitmap: unknown = texture.source.data
    if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) bitmap.close()
    texture.dispose()
  }
  root.clear()
}
