import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HistoryPanel from './HistoryPanel'

describe('HistoryPanel', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('renders loading state then records and notifies selection', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: '1',
          name: 'package.glb',
          size: 1024,
          uploadedAt: new Date().toISOString(),
          path: '/api/model/1.glb',
        },
      ],
    })

    const onSelect = vi.fn()
    render(<HistoryPanel onSelect={onSelect} />)

    expect(screen.getByText('Loading recent models…')).toBeTruthy()
    expect(await screen.findByText('Recent Models')).toBeTruthy()

    fireEvent.click(screen.getByText('package.glb'))
    expect(onSelect).toHaveBeenCalledWith('/api/model/1.glb', 'package.glb')
  })

  it('renders error state and retries successfully', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'History failed' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

    render(<HistoryPanel onSelect={vi.fn()} />)

    expect(await screen.findByText('History failed')).toBeTruthy()
    fireEvent.click(screen.getByText('Retry'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
