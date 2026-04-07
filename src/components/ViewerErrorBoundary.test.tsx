import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ViewerErrorBoundary from './ViewerErrorBoundary'

function Boom({ message }: { message: string }) {
  throw new Error(message)
}

describe('ViewerErrorBoundary', () => {
  it('maps loader errors to a readable message', () => {
    const onError = vi.fn()

    render(
      <ViewerErrorBoundary modelUrl="/broken.glb" onError={onError}>
        <Boom message="Failed to fetch" />
      </ViewerErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledWith(
      'Failed to load model file. Please check that the upload completed successfully.',
    )
  })

  it('resets after modelUrl changes', () => {
    const onError = vi.fn()
    const { rerender } = render(
      <ViewerErrorBoundary modelUrl="/broken.glb" onError={onError}>
        <Boom message="Unexpected token < in JSON" />
      </ViewerErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledWith('This GLTF file could not be parsed.')

    rerender(
      <ViewerErrorBoundary modelUrl="/next.glb" onError={onError}>
        <div>healthy</div>
      </ViewerErrorBoundary>,
    )

    expect(onError).toHaveBeenLastCalledWith('')
    expect(screen.getByText('healthy')).toBeTruthy()
  })
})
