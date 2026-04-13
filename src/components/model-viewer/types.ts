import type * as THREE from 'three'

export interface ModelInfo {
  meshCount: number
  vertexCount: number
  materialCount: number
  textureCount: number
  triangleCount: number
  format: string
  hasTextures: boolean
}

export interface ViewerSettings {
  environment: 'city' | 'studio' | 'sunset' | 'warehouse' | 'forest' | 'night'
  wireframe: boolean
  whiteModel: boolean
  flatShading: boolean
  autoRotate: boolean
  autoRotateSpeed: number
  showGrid: boolean
  showAxes: boolean
  exposure: number
  background: string
  lightIntensity: number
}

export interface ViewerCommandState {
  fitVersion: number
  resetVersion: number
}

export interface ViewerProgressState {
  active: boolean
  progress: number
  loaded: number
  total: number
  item: string
}

export interface LoadedModel {
  root: THREE.Group
  format: string
}
