import * as THREE from 'three'

const WHITE = new THREE.Color('#f4f6f8')
const WIREFRAME_COLOR = new THREE.Color('#8ce3dc')

type MaterialWithUserData = THREE.Material & {
  userData: {
    originalColor?: string
    originalEmissive?: string
    originalFlatShading?: boolean
    originalWireframe?: boolean
    wireframeHelper?: THREE.LineSegments
    [key: string]: unknown
  }
}

type MeshWithWireframe = THREE.Mesh & {
  userData: {
    originalVisible?: boolean
    [key: string]: unknown
  }
}

function eachMesh(root: THREE.Object3D, cb: (mesh: MeshWithWireframe) => void) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      cb(obj as MeshWithWireframe)
    }
  })
}

function eachMeshMaterial(root: THREE.Object3D, cb: (material: MaterialWithUserData) => void) {
  eachMesh(root, (mesh) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      if (material) cb(material as MaterialWithUserData)
    })
  })
}

function syncWireframeHelpers(root: THREE.Object3D, enabled: boolean) {
  eachMesh(root, (mesh) => {
    if (mesh.userData.originalVisible === undefined) {
      mesh.userData.originalVisible = mesh.visible
    }

    const helperKey = '__packviewWireframeHelper'
    const existingHelper = mesh.userData[helperKey] as THREE.LineSegments | undefined

    if (enabled) {
      mesh.visible = false

      if (!existingHelper) {
        const geometry = new THREE.WireframeGeometry(mesh.geometry)
        const material = new THREE.LineBasicMaterial({
          color: WIREFRAME_COLOR,
          transparent: true,
          opacity: 1,
        })
        const helper = new THREE.LineSegments(geometry, material)
        helper.name = `${mesh.name || 'mesh'}-wireframe`
        helper.renderOrder = 2
        helper.matrixAutoUpdate = false
        mesh.add(helper)
        mesh.userData[helperKey] = helper
      }

      const helper = mesh.userData[helperKey] as THREE.LineSegments
      helper.visible = true
      helper.matrix.copy(mesh.matrixWorld)
      helper.matrixAutoUpdate = true
      helper.position.set(0, 0, 0)
      helper.rotation.set(0, 0, 0)
      helper.scale.set(1, 1, 1)
    } else {
      mesh.visible = mesh.userData.originalVisible ?? true
      if (existingHelper) {
        mesh.remove(existingHelper)
        existingHelper.geometry.dispose()
        ;(existingHelper.material as THREE.Material).dispose()
        delete mesh.userData[helperKey]
      }
    }
  })
}

export function applyRenderModes(
  root: THREE.Object3D,
  options: { wireframe: boolean; whiteModel: boolean; flatShading: boolean },
) {
  syncWireframeHelpers(root, options.wireframe)

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

    standard.wireframe = options.wireframe ? false : (material.userData.originalWireframe ?? false)
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
