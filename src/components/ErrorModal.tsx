import React from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface ErrorModalProps {
  isOpen: boolean
  error: string | null
  title?: string
  onClose: () => void
  onRetry?: () => void
}

export function ErrorModal({ isOpen, error, title = 'Error', onClose, onRetry }: ErrorModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getErrorMessage = (error: string) => {
    // Parse common error types and provide user-friendly messages
    const lowerError = error.toLowerCase()
    
    if (lowerError.includes('api key') || lowerError.includes('invalid key') || lowerError.includes('unauthorized')) {
      return 'Invalid API key. Please check your Google Gemini API key and try again.'
    }
    
    if (lowerError.includes('quota') || lowerError.includes('limit')) {
      return 'API quota exceeded. Please check your API usage limits or try again later.'
    }
    
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
      return 'Network connection error. Please check your internet connection and try again.'
    }
    
    if (lowerError.includes('timeout')) {
      return 'Request timed out. The server took too long to respond. Please try again.'
    }
    
    if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
      return 'Too many requests. Please wait a moment before trying again.'
    }
    
    if (lowerError.includes('server error') || lowerError.includes('500') || lowerError.includes('503')) {
      return 'Server error. The service is temporarily unavailable. Please try again later.'
    }
    
    // Return original error if no pattern matches
    return error
  }

  const getErrorIcon = (error: string) => {
    const lowerError = error.toLowerCase()
    
    if (lowerError.includes('api key') || lowerError.includes('unauthorized')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <circle cx="12" cy="16" r="1"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      )
    }
    
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      )
    }
    
    // Default error icon
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    )
  }

  if (!error) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="error-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="error-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <div className="error-modal-header">
              <div className="error-icon">
                {getErrorIcon(error)}
              </div>
              <h2>{title}</h2>
            </div>

            <div className="error-modal-content">
              <p className="error-message">
                {getErrorMessage(error)}
              </p>
              
              {error !== getErrorMessage(error) && (
                <details className="error-details">
                  <summary>Technical Details</summary>
                  <pre className="error-raw">{error}</pre>
                </details>
              )}
            </div>

            <div className="error-modal-actions">
              {onRetry && (
                <button
                  onClick={() => {
                    onRetry()
                    onClose()
                  }}
                  className="retry-button"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onClose}
                className="close-button"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
