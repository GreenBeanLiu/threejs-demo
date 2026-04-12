import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import DropZone from './DropZone'

const uploadModelFileMock = vi.fn()
const createObjectUrlMock = vi.fn(() => 'blob:preview-model')
const revokeObjectUrlMock = vi.fn()

vi.mock('../lib/uploads', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/uploads')>()

  return {
    ...actual,
    uploadModelFile: (file: File) => uploadModelFileMock(file),
  }
})

describe('DropZone', () => {
  beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrlMock,
    })

    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrlMock,
    })
  })

  beforeEach(() => {
    uploadModelFileMock.mockReset()
    createObjectUrlMock.mockClear()
    createObjectUrlMock.mockReturnValue('blob:preview-model')
    revokeObjectUrlMock.mockClear()
  })

  it('shows validation error for unsupported files', async () => {
    const { container } = render(<DropZone onFile={vi.fn()} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText('Only GLB and GLTF files are supported.')).toBeTruthy()
  })

  it('uploads a valid model and shows success feedback', async () => {
    uploadModelFileMock.mockResolvedValue({ path: '/api/model/abc.glb' })

    const onFile = vi.fn()
    const onProcessing = vi.fn()
    const onUploadComplete = vi.fn()

    const { container } = render(
      <DropZone
        onFile={onFile}
        onProcessing={onProcessing}
        onUploadComplete={onUploadComplete}
      />,
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['model'], 'package.glb', { type: 'model/gltf-binary' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(uploadModelFileMock).toHaveBeenCalledWith(file)
    })

    await waitFor(() => {
      expect(onFile).toHaveBeenCalledWith('blob:preview-model', 'package.glb', true)
    })

    expect(onFile).toHaveBeenLastCalledWith('/api/model/abc.glb', 'package.glb', false)
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:preview-model')
    expect(onProcessing).toHaveBeenNthCalledWith(1, true)
    expect(onProcessing).toHaveBeenLastCalledWith(false)
    expect(onUploadComplete).toHaveBeenCalled()
    expect(await screen.findByText('Model uploaded successfully.')).toBeTruthy()
  })

  it('shows server upload errors', async () => {
    uploadModelFileMock.mockResolvedValue({ error: 'Upload service misconfigured' })

    const { container } = render(<DropZone onFile={vi.fn()} onProcessing={vi.fn()} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['model'], 'broken.glb', { type: 'model/gltf-binary' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:preview-model')
    })
    expect(await screen.findByText('Upload service misconfigured')).toBeTruthy()
  })
})
