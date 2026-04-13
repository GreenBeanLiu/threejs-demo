import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import type { LoadedModel } from './types'

function getFormat(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase()
  if (cleanUrl.endsWith('.glb')) return 'glb'
  if (cleanUrl.endsWith('.gltf')) return 'gltf'
  if (cleanUrl.endsWith('.obj')) return 'obj'
  if (cleanUrl.endsWith('.stl')) return 'stl'
  return 'unknown'
}

function createDefaultMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#d8dde3',
    roughness: 0.7,
    metalness: 0.05,
  })
}

export async function loadModelByFormat(url: string): Promise<LoadedModel> {
  const format = getFormat(url)

  if (format === 'obj') {
    const loader = new OBJLoader()
    const root = await loader.loadAsync(url)
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !obj.material) {
        obj.material = createDefaultMaterial()
      }
    })
    return { root, format }
  }

  if (format === 'stl') {
    const loader = new STLLoader()
    const geometry = await loader.loadAsync(url)
    geometry.computeVertexNormals()
    const mesh = new THREE.Mesh(geometry, createDefaultMaterial())
    const root = new THREE.Group()
    root.add(mesh)
    return { root, format }
  }

  throw new Error('Unsupported loader format')
}
