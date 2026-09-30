import { BoxGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three'
import type { LoadedModel } from './types'

export const demoCubeId = 'demo_cube'
export const cubeFaceIds = ['face_front', 'face_back', 'face_left', 'face_right', 'face_top', 'face_bottom'] as const

export function createDemoCube(): LoadedModel {
  const root = new Group()
  root.name = demoCubeId
  const plane = new PlaneGeometry(2, 2)
  const parts = cubeFaceIds.map((id) => {
    const face = new Mesh(plane, new MeshStandardMaterial({ color: '#c9ced3', roughness: 0.65, metalness: 0 }))
    face.name = id
    return face
  })
  const [front, back, left, right, top, bottom] = parts
  front.position.z = 1
  back.position.z = -1
  back.rotation.y = Math.PI
  left.position.x = -1
  left.rotation.y = -Math.PI / 2
  right.position.x = 1
  right.rotation.y = Math.PI / 2
  top.position.y = 1
  top.rotation.x = -Math.PI / 2
  bottom.position.y = -1
  bottom.rotation.x = Math.PI / 2
  root.add(...parts)

  const box = new BoxGeometry(2, 2, 2)
  const edges = new LineSegments(new EdgesGeometry(box), new LineBasicMaterial({ color: '#929ba2' }))
  edges.name = 'cube_edges'
  box.dispose()
  root.add(edges)
  return { root, parts: parts.map((object) => ({ id: object.name, object, meshes: [object] })) }
}
