import '@google/model-viewer'
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { ModelViewerElement as MVElement } from '@google/model-viewer'

export type ModelViewerHandle = {
  fitToModel: () => void
  resetView: () => void
}

const ENV_IMAGE: Record<string, string> = {
  studio: 'neutral',
  city: 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr',
  warehouse: 'legacy',
  sunset: 'https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr',
  forest: 'https://modelviewer.dev/shared-assets/environments/whipple_creek_regional_park_04_1k_HDR.hdr',
  night: 'legacy',
}

interface Props {
  src: string
  autoRotate: boolean
  autoRotateSpeed: number
  exposure: number
  background: string
  environment: string
  onLoad?: () => void
  onError?: (msg: string) => void
  onProgress?: (progress: number) => void
}

export default forwardRef<ModelViewerHandle, Props>(function ModelViewerElement(
  { src, autoRotate, autoRotateSpeed, exposure, background, environment, onLoad, onError, onProgress },
  ref,
) {
  const mvRef = useRef<MVElement>(null)

  useImperativeHandle(ref, () => ({
    fitToModel: () => {
      const mv = mvRef.current
      if (!mv) return
      mv.cameraOrbit = 'auto auto auto'
      mv.fieldOfView = 'auto'
      mv.jumpCameraToGoal()
    },
    resetView: () => {
      const mv = mvRef.current
      if (!mv) return
      mv.resetTurntableRotation()
      mv.cameraOrbit = 'auto auto auto'
      mv.fieldOfView = 'auto'
      mv.jumpCameraToGoal()
    },
  }))

  useEffect(() => {
    const mv = mvRef.current
    if (!mv) return

    const handleLoad = () => onLoad?.()
    const handleError = (e: Event) => {
      const detail = (e as CustomEvent).detail
      onError?.(detail?.message ?? 'Failed to load model')
    }
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail
      onProgress?.(detail?.totalProgress ?? 0)
    }

    mv.addEventListener('load', handleLoad)
    mv.addEventListener('error', handleError)
    mv.addEventListener('progress', handleProgress)
    return () => {
      mv.removeEventListener('load', handleLoad)
      mv.removeEventListener('error', handleError)
      mv.removeEventListener('progress', handleProgress)
    }
  }, [onLoad, onError, onProgress])

  const envImage = ENV_IMAGE[environment] ?? 'neutral'

  return (
    // @ts-expect-error model-viewer is a web component
    <model-viewer
      ref={mvRef}
      src={src}
      camera-controls
      auto-rotate={autoRotate ? '' : undefined}
      rotation-per-second={`${autoRotateSpeed * 30}deg`}
      exposure={exposure}
      environment-image={envImage}
      shadow-intensity="1"
      shadow-softness="0.5"
      style={{ width: '100%', height: '100%', background }}
    />
  )
})
