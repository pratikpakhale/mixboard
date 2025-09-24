import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface ApiKeyModalProps {
  isOpen: boolean
  onApiKeySubmit: (apiKey: string) => void
  onClose?: () => void
  existingApiKey?: string
}

export function ApiKeyModal({ isOpen, onApiKeySubmit, onClose, existingApiKey }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(existingApiKey || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingApiKey) {
      setApiKey(existingApiKey)
    }
  }, [existingApiKey])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError('Please enter a valid API key')
      return
    }

    setIsSubmitting(true)
    setError('')

    // Basic format validation 
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      setError('Please enter a valid Google Gemini API key format')
      setIsSubmitting(false)
      return
    }

    try {
      // Save the API key directly to localStorage
      onApiKeySubmit(apiKey.trim())
      setApiKey('')
      setError('')
    } catch (err) {
      console.error('Failed to save API key:', err)
      setError('Failed to save API key. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="api-key-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="api-key-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <div className="api-key-modal-header">
              <h2>Configure Google Gemini API Key</h2>
              <p>Enter your Google Gemini API key to generate images and content.</p>
            </div>

            <form onSubmit={handleSubmit} className="api-key-form">
              <div className="form-group">
                <label htmlFor="api-key-input">API Key</label>
                <input
                  id="api-key-input"
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError('')
                  }}
                  placeholder="AIza..."
                  className="api-key-input"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {error && <span className="error-message">{error}</span>}
              </div>

              <div className="api-key-info">
                <p>
                  Get your API key from{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="api-key-link"
                  >
                    Google AI Studio
                  </a>
                </p>
                <p className="privacy-note">
                  Your API key is stored locally and never sent to our servers.
                </p>
              </div>

              <div className="form-actions">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="cancel-button"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting || !apiKey.trim()}
                >
                  {isSubmitting ? (
                    <motion.div
                      className="loading-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : existingApiKey ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
