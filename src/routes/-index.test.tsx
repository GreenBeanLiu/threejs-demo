import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route } from './index'

const headerMock = vi.fn()
const historyPanelMock = vi.fn()
const dropZoneMock = vi.fn()
const viewerShellMock = vi.fn()

vi.mock('../components/Header', () => ({
  default: (props: Record<string, unknown>) => {
    headerMock(props)
    return <div data-testid="header-stub" />
  },
}))

vi.mock('../components/HistoryPanel', () => ({
  default: (props: Record<string, unknown>) => {
    historyPanelMock(props)
    return <div data-testid="history-stub" />
  },
}))

vi.mock('../components/DropZone', () => ({
  default: (props: Record<string, unknown>) => {
    dropZoneMock(props)
    return <div data-testid="dropzone-stub" />
  },
}))

vi.mock('../components/ViewerShell', () => ({
  default: (props: any) => {
    viewerShellMock(props)
    return (
      <div data-testid="viewer-shell-stub">
        <button onClick={() => props.onViewerError('Broken model')}>emit-error</button>
        <button
          onClick={() =>
            props.onViewerProgress({
              active: false,
              progress: 100,
              loaded: 1,
              total: 1,
              item: 'scene.glb',
            })
          }
        >
          emit-progress-done
        </button>
      </div>
    )
  },
}))

describe('index route', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  beforeAll(() => {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  })

  beforeEach(() => {
    headerMock.mockReset()
    historyPanelMock.mockReset()
    dropZoneMock.mockReset()
    viewerShellMock.mockReset()
  })

  it('shows screenshot success feedback', async () => {
    const anchorClick = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          click: anchorClick,
          set download(_value: string) {},
          set href(_value: string) {},
        } as unknown as HTMLAnchorElement
      }

      return originalCreateElement(tagName)
    })

    const canvas = document.createElement('canvas')
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'canvas') {
        return canvas
      }
      return null
    })
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,abc')

    const Component = Route.options.component
    render(<Component />)

    const onFile = dropZoneMock.mock.calls[0][0].onFile as (url: string, name: string) => void
    onFile('/api/model/1.glb', 'package.glb')

    expect(await screen.findByTitle('Save screenshot')).toBeTruthy()
    fireEvent.click(screen.getByTitle('Save screenshot'))

    expect(await screen.findByText('Screenshot saved.')).toBeTruthy()
    expect(anchorClick).toHaveBeenCalled()

    createElementSpy.mockRestore()
  })

  it('shows viewer recovery actions and can go back to upload', async () => {
    const Component = Route.options.component
    render(<Component />)

    const onFile = dropZoneMock.mock.calls[0][0].onFile as (url: string, name: string) => void
    onFile('/api/model/1.glb', 'broken.glb')

    expect(await screen.findByTestId('viewer-shell-stub')).toBeTruthy()
    fireEvent.click(screen.getByText('emit-error'))

    expect(await screen.findByText('Broken model')).toBeTruthy()
    expect(screen.getByText('Retry load')).toBeTruthy()
    fireEvent.click(screen.getByText('Back to upload'))

    await waitFor(() => {
      expect(screen.getByTestId('dropzone-stub')).toBeTruthy()
    })
  })
})
