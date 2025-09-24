import { useState, useEffect } from 'react'
import { Tldraw, type TLComponents } from 'tldraw'
import 'tldraw/tldraw.css'
import { ImageGeneratorPanel } from './components/ImageGeneratorPanel'
import './components/ImageGeneratorPanel.css'
import { VerticalToolbar } from './components/VerticalToolbar'
import { CollapsibleStylePanel } from './components/CollapsibleStylePanel'
import { ApiKeyModal } from './components/ApiKeyModal'
import './components/ApiKeyModal.css'
import { ErrorModal } from './components/ErrorModal'
import './components/ErrorModal.css'
import { PageManagement } from './components/PageManagement'
import './components/PageManagement.css'
import { hasStoredApiKey, setStoredApiKey, getStoredApiKey } from './lib/ai'

// Create CustomBackground as a component that can receive props
function createCustomBackground(onError: (error: string, onRetry?: () => void) => void) {
  return function CustomBackground() {
    return (
      <>
        <PageManagement />
        <ImageGeneratorPanel onError={onError} />
      </>
    )
  }
}

export default function App() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [errorState, setErrorState] = useState<{
    show: boolean;
    error: string | null;
    onRetry?: () => void;
  }>({ show: false, error: null })

  useEffect(() => {
    // Check if API key exists on app startup
    if (!hasStoredApiKey()) {
      setShowApiKeyModal(true)
    }
  }, [])

  const handleApiKeySubmit = (apiKey: string) => {
    try {
      setStoredApiKey(apiKey)
      setShowApiKeyModal(false)
    } catch (error) {
      console.error('Failed to save API key:', error)
      // Error handling is done in the modal component
    }
  }

  const handleOpenApiKeyModal = () => {
    setShowApiKeyModal(true)
  }

  const handleError = (error: string, onRetry?: () => void) => {
    setErrorState({
      show: true,
      error,
      onRetry
    })
  }

  const handleCloseError = () => {
    setErrorState({ show: false, error: null })
  }

  // Component overrides for tldraw - custom vertical toolbar and collapsible style panel
  const components: TLComponents = {
    InFrontOfTheCanvas: createCustomBackground(handleError),
    Toolbar: VerticalToolbar,
    StylePanel: (props) => (
      <CollapsibleStylePanel 
        {...props} 
        onOpenSettings={handleOpenApiKeyModal}
      />
    ),
    // Hide most UI elements but keep toolbar and style panel
    ActionsMenu: null,
    HelpMenu: null,
    ZoomMenu: null,
    MainMenu: null,
    QuickActions: null,
    NavigationPanel: null,
    PageMenu: null,
    TopPanel: null,
    SharePanel: null,
    MenuPanel: null,
    KeyboardShortcutsDialog: null,
    HelperButtons: null,
    DebugPanel: null,
    DebugMenu: null,
  }

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0,
      background: 'var(--color-background)',
      backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--color-foreground) 15%, transparent) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px'
    }}>
      <Tldraw 
        components={components}
        persistenceKey="tldraw-app-pages"
        onMount={(editor) => {
          // Set initial zoom to 80%
          editor.setCamera({ x: 0, y: 0, z: 0.8 })
        }}
      />
      
      <ApiKeyModal 
        isOpen={showApiKeyModal}
        onApiKeySubmit={handleApiKeySubmit}
        onClose={() => setShowApiKeyModal(false)}
        existingApiKey={getStoredApiKey() || undefined}
      />
      
      <ErrorModal
        isOpen={errorState.show}
        error={errorState.error}
        onClose={handleCloseError}
        onRetry={errorState.onRetry}
      />
    </div>
  )
}

