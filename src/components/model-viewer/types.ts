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
  environment: 'studio' | 'city' | 'warehouse' | 'sunset' | 'forest' | 'night'
  autoRotate: boolean
  autoRotateSpeed: number
  exposure: number
  background: string
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
