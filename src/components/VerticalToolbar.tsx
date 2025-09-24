import React from 'react'
import { useEditor, useValue } from 'tldraw'

const ToolbarButton: React.FC<{
  tool: string
  children: React.ReactNode
  isActive: boolean
  onClick: () => void
}> = ({ tool, children, isActive, onClick }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Toolbar button clicked: ${tool}, currently active: ${isActive}`);
      onClick();
    }}
    className={`toolbar-btn ${isActive ? 'active' : ''}`}
    data-state={isActive ? 'selected' : 'unselected'}
    data-active={isActive}
    title={tool}
    style={{
      pointerEvents: 'auto',
      position: 'relative',
      zIndex: 11000,
    }}
  >
    {children}
  </button>
)

export const VerticalToolbar: React.ComponentType = () => {
  const editor = useEditor()
  const currentTool = useValue(
    'current tool',
    () => {
      if (!editor) return 'select'
      const tool = editor.getCurrentTool()
      console.log('Current tool from useValue:', tool?.id)
      return tool?.id || 'select'
    },
    [editor]
  )

  const setTool = (toolId: string) => {
    console.log(`Attempting to set tool: ${toolId}`, { editor: !!editor, currentTool });
    if (editor) {
      editor.setCurrentTool(toolId)
      console.log(`Tool set to: ${toolId}`);
    } else {
      console.error('Editor not available');
    }
  }

  return (
    <div
      className="vertical-toolbar-container"
      style={{
        position: 'fixed',
        top: '50%',
        left: '1rem',
        transform: 'translateY(-50%)',
        zIndex: 11000,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      
      <ToolbarButton
        tool="Select"
        isActive={currentTool === 'select'}
        onClick={() => setTool('select')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          <path d="m13 13 6 6"/>
        </svg>
      </ToolbarButton>

      <ToolbarButton
        tool="Hand"
        isActive={currentTool === 'hand'}
        onClick={() => setTool('hand')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 11V6a2 2 0 0 0-4 0v5"/>
          <path d="M14 10V4a2 2 0 0 0-4 0v2"/>
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
          <path d="m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5"/>
        </svg>
      </ToolbarButton>

      <ToolbarButton
        tool="Text"
        isActive={currentTool === 'text'}
        onClick={() => setTool('text')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4,7 4,4 20,4 20,7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      </ToolbarButton>
    </div>
  )
}
