import React, { useState } from 'react'
import { 
  DefaultStylePanel,
  type TLUiStylePanelProps 
} from 'tldraw'
import { ZoomLevelDisplay } from './ZoomLevelDisplay'

interface CollapsibleStylePanelProps extends TLUiStylePanelProps {
  onOpenSettings?: () => void
}

export function CollapsibleStylePanel(props: CollapsibleStylePanelProps) {
  const { onOpenSettings, ...styleProps } = props
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Toggle clicked, current state:', isCollapsed)
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className="collapsible-style-panel-container">
      <div className="top-right-controls">
        <ZoomLevelDisplay />
        {onOpenSettings && (
          <button 
            className="settings-button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenSettings()
            }}
            title="API Key Settings"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        )}
        <button 
          className={`style-panel-toggle ${isCollapsed ? 'collapsed' : 'expanded'}`}
          onClick={handleToggle}
          title={isCollapsed ? 'Expand style panel' : 'Collapse style panel'}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={`toggle-icon ${isCollapsed ? '' : 'expanded'}`}
          >
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      </div>
      {!isCollapsed && (
        <div className="style-panel-content">
          <DefaultStylePanel {...styleProps} />
        </div>
      )}
    </div>
  )
}
