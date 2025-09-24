import React, { useState } from 'react'
import { useEditor, useValue, type TLPage } from 'tldraw'
import { motion, AnimatePresence } from 'motion/react'

export function PageManagement() {
  const editor = useEditor()
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const [newPageName, setNewPageName] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current pages and current page
  const pages = useValue(
    'pages',
    () => {
      if (!editor) return []
      return editor.getPages().sort((a, b) => a.index.localeCompare(b.index))
    },
    [editor]
  )

  const currentPage = useValue(
    'current page',
    () => {
      if (!editor) return null
      return editor.getCurrentPage()
    },
    [editor]
  )

  const createNewPage = () => {
    if (!editor) return
    
    const pageCount = pages.length
    const newPageName = `Page ${pageCount + 1}`
    
    editor.createPage({ name: newPageName })
    const newPages = editor.getPages()
    const createdPage = newPages.find(p => p.name === newPageName)
    if (createdPage) {
      editor.setCurrentPage(createdPage.id)
    }
  }

  const deletePage = (pageId: string) => {
    if (!editor || pages.length <= 1) return // Don't delete the last page
    
    const pageToDelete = pages.find(p => p.id === pageId)
    if (!pageToDelete) return

    // If deleting current page, switch to another page first
    if (currentPage?.id === pageId) {
      const otherPage = pages.find(p => p.id !== pageId)
      if (otherPage) {
        editor.setCurrentPage(otherPage.id)
      }
    }
    
    editor.deletePage(pageId)
  }

  const switchToPage = (pageId: string) => {
    if (!editor) return
    editor.setCurrentPage(pageId)
  }

  const startRenaming = (pageId: string, currentName: string) => {
    setIsRenaming(pageId)
    setNewPageName(currentName)
  }

  const finishRenaming = () => {
    if (!editor || !isRenaming || !newPageName.trim()) {
      setIsRenaming(null)
      setNewPageName('')
      return
    }

    editor.updatePage({ id: isRenaming, name: newPageName.trim() })
    setIsRenaming(null)
    setNewPageName('')
  }

  const cancelRenaming = () => {
    setIsRenaming(null)
    setNewPageName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishRenaming()
    } else if (e.key === 'Escape') {
      cancelRenaming()
    }
  }

  if (!editor || pages.length === 0) return null

  return (
    <div className="page-management">
      {/* Toggle Button */}
      <button
        className="page-management-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse page manager' : 'Expand page manager'}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
        >
          <path d="M3 7H21L12 17L3 7Z"/>
        </svg>
        <span className="current-page-indicator">
          {currentPage?.name || 'Page 1'} ({pages.length})
        </span>
      </button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="page-management-panel"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            {/* Page Tabs */}
            <div className="page-tabs">
              {pages.map((page: TLPage) => (
                <div
                  key={page.id}
                  className={`page-tab ${currentPage?.id === page.id ? 'active' : ''}`}
                >
                  {isRenaming === page.id ? (
                    <input
                      type="text"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={finishRenaming}
                      className="page-rename-input"
                      autoFocus
                    />
                  ) : (
                    <>
                      <button
                        className="page-tab-button"
                        onClick={() => switchToPage(page.id)}
                        title={`Switch to ${page.name}`}
                      >
                        {page.name}
                      </button>
                      <div className="page-tab-actions">
                        <button
                          className="page-action-button rename-button"
                          onClick={() => startRenaming(page.id, page.name)}
                          title="Rename page"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="m18.5 2.5-2.5 2.5L21 10l-5-5 2.5-2.5z"/>
                          </svg>
                        </button>
                        {pages.length > 1 && (
                          <button
                            className="page-action-button delete-button"
                            onClick={() => deletePage(page.id)}
                            title="Delete page"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18"/>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                              <path d="M8 6V4c0-1 1-2 2-2h4c-1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Page Button */}
            <button
              className="add-page-button"
              onClick={createNewPage}
              title="Create new page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Page
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
