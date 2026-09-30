import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import type { LoadedModel } from './types'

export function createInteractionTestModel(): LoadedModel {
  const root = new Group()
  root.name = 'test_root'
  const shared = new MeshStandardMaterial({ color: '#c9ced3', roughness: 0.65, metalness: 0 })
  const small = new BoxGeometry(1.1, 0.75, 1)
  const tall = new BoxGeometry(1.1, 1.85, 1)
  const partA = new Group()
  partA.name = 'assembly_left'
  partA.position.x = -2
  const a1 = new Mesh(small, shared)
  a1.name = 'mesh_a1'
  a1.position.y = 0.55
  const a2 = new Mesh(small, Array.from({ length: 6 }, () => shared))
  a2.name = 'mesh_a2'
  a2.position.y = -0.55
  partA.add(a1, a2)

  const partB = new Group()
  partB.name = 'assembly_middle'
  const b1 = new Mesh(tall, shared)
  b1.name = 'mesh_b1'
  partB.add(b1)

  const partC = new Group()
  partC.name = 'assembly_right'
  partC.position.x = 2
  const outer = new Group()
  const inner = new Group()
  outer.name = 'detail_outer'
  inner.name = 'detail_inner'
  const c1 = new Mesh(tall, shared)
  c1.name = 'mesh_c1'
  inner.add(c1)
  outer.add(inner)
  partC.add(outer)
  root.add(partA, partB, partC)
  return {
    root,
    parts: [
      { id: 'part_a', object: partA, meshes: [a1, a2], sourceName: partA.name },
      { id: 'part_b', object: partB, meshes: [b1], sourceName: partB.name },
      { id: 'part_c', object: partC, meshes: [c1], sourceName: partC.name },
    ],
  }
}
