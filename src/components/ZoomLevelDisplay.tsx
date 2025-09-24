import React from 'react'
import { useEditor, useValue } from 'tldraw'

export function ZoomLevelDisplay() {
  const editor = useEditor()
  
  const zoomLevel = useValue(
    'zoom level',
    () => {
      if (!editor) return 100
      const zoom = editor.getZoomLevel()
      return Math.round(zoom * 100)
    },
    [editor]
  )

  return (
    <div className="zoom-level-display">
      {zoomLevel}%
    </div>
  )
}
