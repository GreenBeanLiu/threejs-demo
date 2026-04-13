import * as THREE from 'three'

const WHITE = new THREE.Color('#f4f6f8')

type MaterialWithUserData = THREE.Material & {
  userData: {
    originalColor?: string
    originalEmissive?: string
    originalFlatShading?: boolean
    originalWireframe?: boolean
    [key: string]: unknown
  }
}

function eachMeshMaterial(root: THREE.Object3D, cb: (material: MaterialWithUserData) => void) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      materials.forEach((material) => {
        if (material) cb(material as MaterialWithUserData)
      })
    }
  })
}

export function applyRenderModes(
  root: THREE.Object3D,
  options: { wireframe: boolean; whiteModel: boolean; flatShading: boolean },
) {
  eachMeshMaterial(root, (material) => {
    const standard = material as THREE.MeshStandardMaterial

    if (material.userData.originalWireframe === undefined) {
      material.userData.originalWireframe = standard.wireframe ?? false
    }
    if (material.userData.originalFlatShading === undefined) {
      material.userData.originalFlatShading = standard.flatShading ?? false
    }
    if ('color' in standard && standard.color && material.userData.originalColor === undefined) {
      material.userData.originalColor = `#${standard.color.getHexString()}`
    }
    if ('emissive' in standard && standard.emissive && material.userData.originalEmissive === undefined) {
      material.userData.originalEmissive = `#${standard.emissive.getHexString()}`
    }

    standard.wireframe = options.wireframe
    standard.flatShading = options.flatShading

    if ('color' in standard && standard.color) {
      if (options.whiteModel) {
        standard.color.copy(WHITE)
      } else if (material.userData.originalColor) {
        standard.color.set(material.userData.originalColor)
      }
    }

    if ('emissive' in standard && standard.emissive) {
      if (options.whiteModel) {
        standard.emissive.set('#000000')
      } else if (material.userData.originalEmissive) {
        standard.emissive.set(material.userData.originalEmissive)
      }
    }

    standard.needsUpdate = true
  })
}
