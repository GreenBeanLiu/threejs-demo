import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ViewerErrorBoundaryProps {
  children: ReactNode
  modelUrl: string | null
  onError?: (message: string) => void
}

interface ViewerErrorBoundaryState {
  hasError: boolean
}

function toViewerErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (/failed to fetch/i.test(error.message)) {
      return 'Failed to load model file. Please check that the upload completed successfully.'
    }

    if (/Unexpected token|JSON/i.test(error.message)) {
      return 'This GLTF file could not be parsed.'
    }

    if (/buffer|geometry|mesh|scene/i.test(error.message)) {
      return 'The model file appears to be invalid or incomplete.'
    }

    return error.message
  }

  return 'Failed to load model.'
}

export default class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, _errorInfo: ErrorInfo) {
    this.props.onError?.(toViewerErrorMessage(error))
  }

  componentDidUpdate(prevProps: ViewerErrorBoundaryProps) {
    if (prevProps.modelUrl !== this.props.modelUrl && this.state.hasError) {
      this.setState({ hasError: false })
      this.props.onError?.('')
    }
  }

  render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}
