import { useState, useEffect } from 'react'
import { useEditor, useValue, type TLImageShape, type TLAsset } from 'tldraw'
import { generateContent } from '../lib/ai'
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input'

interface AttachedImage {
  id: string
  dataUrl: string
  name: string
  shapeId: string
}

interface ImageGeneratorPanelProps {
  onError?: (error: string, onRetry?: () => void) => void
}

export function ImageGeneratorPanel({ onError }: ImageGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
  const editor = useEditor()

  // Track selected image shapes
  const selectedImageShapes = useValue(
    'selected image shapes',
    () => {
      if (!editor) return []
      const selectedShapes = editor.getSelectedShapes()
      return selectedShapes.filter((shape): shape is TLImageShape => 
        shape.type === 'image'
      )
    },
    [editor]
  )

  // Convert selected shapes to attached images when selection changes
  useEffect(() => {
    const convertSelectedToAttached = async () => {
      if (selectedImageShapes.length === 0) {
        // Clear attached images if no images are selected
        setAttachedImages([])
        return
      }

      setAttachedImages(prev => {
        const newAttachedImages: AttachedImage[] = []
        
        for (const shape of selectedImageShapes) {
          try {
            if (!shape.props.assetId) continue;
            
            const asset = editor.getAsset(shape.props.assetId) as TLAsset | undefined
            if (asset && asset.type === 'image' && asset.props.src) {
              // Check if already attached to avoid duplicates
              const isAlreadyAttached = prev.some(img => img.shapeId === shape.id)
              if (!isAlreadyAttached) {
                newAttachedImages.push({
                  id: `attached-${shape.id}`,
                  dataUrl: asset.props.src,
                  name: asset.props.name || 'Selected Image',
                  shapeId: shape.id
                })
              }
            }
          } catch (error) {
            console.error('Failed to get asset for shape:', shape.id, error)
          }
        }
        
        // Keep existing images that are still selected and add new ones
        const stillSelected = prev.filter(img => 
          selectedImageShapes.some(shape => shape.id === img.shapeId)
        )
        
        return [...stillSelected, ...newAttachedImages]
      })
    }

    convertSelectedToAttached()
  }, [selectedImageShapes, editor])

  // Function to remove an attached image
  const removeAttachedImage = (imageId: string) => {
    setAttachedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const placeholders = [
    "A surreal dreamscape with floating islands and purple skies",
    "Cyberpunk cityscape with neon lights reflecting in puddles",
    "Minimalist mountain landscape in watercolor style",
    "Vintage botanical illustration of exotic flowers",
    "Abstract geometric patterns in gold and navy blue",
    "Cozy cabin in a snowy forest with warm glowing windows",
    "Space station orbiting a colorful nebula",
    "Art nouveau poster of a dancing figure",
  ]

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    
    const attemptGeneration = async () => {
      return await generateContent({
        prompt: prompt.trim(),
        attachedImages: attachedImages.map(img => ({
          dataUrl: img.dataUrl,
          name: img.name
        })),
        skipDownload: true, // Don't auto-download when adding to canvas
        onImageGenerated: async (fileName, mimeType, imageData) => {
          try {
            console.log(`Generated image: ${fileName} (${mimeType})`)
            
            // Convert base64 to blob for the asset
            const binaryString = atob(imageData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mimeType });
            
            // Create a data URL for the asset
            const dataUrl = `data:${mimeType};base64,${imageData}`;
            
            // Load image to get actual dimensions
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = dataUrl;
            });

            // Create the asset with actual dimensions
            const assetId = `asset:${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const asset = {
              id: assetId as `asset:${string}`,
              type: 'image' as const,
              typeName: 'asset' as const,
              props: {
                name: fileName,
                src: dataUrl,
                w: img.width,
                h: img.height,
                mimeType,
                isAnimated: false,
                fileSize: blob.size,
              },
              meta: {},
            };
            
            editor.createAssets([asset]);
            
            // Calculate dimensions while preserving aspect ratio
            const maxDimension = 300; // Maximum size for any dimension
            const aspectRatio = img.width / img.height;
            
            let displayWidth, displayHeight;
            if (img.width > img.height) {
              // Landscape orientation
              displayWidth = Math.min(img.width, maxDimension);
              displayHeight = displayWidth / aspectRatio;
            } else {
              // Portrait or square orientation
              displayHeight = Math.min(img.height, maxDimension);
              displayWidth = displayHeight * aspectRatio;
            }
            
            // Get viewport center for positioning above input box
            const viewportCenter = editor.getViewportScreenCenter();
            
            // Calculate position based on existing images to avoid overlaps
            const existingImages = editor.getCurrentPageShapes()
              .filter(shape => shape.type === 'image')
              .length;
            
            // Position images right above the input box at screen bottom
            // Input box CSS: bottom: 1.5rem (24px), height: 48px
            const inputHeight = 48;
            const inputBottomMargin = 24;
            const imageSpacing = 20; // Small gap between image and input
            
            // Horizontal layout with spacing between images - use actual width for spacing
            const horizontalSpacing = Math.max(displayWidth + 20, 320); // Minimum spacing of 320px
            const offsetX = existingImages * horizontalSpacing;
            
            // Center the first image horizontally, then offset others to the right
            const startX = viewportCenter.x - (displayWidth / 2);
            
            // Position right above input box (screen coordinates)
            const screenHeight = window.innerHeight;
            const yPosition = screenHeight - inputBottomMargin - inputHeight - imageSpacing - displayHeight;
            
            // Convert screen coordinates to canvas coordinates
            const canvasY = editor.screenToPage({ x: 0, y: yPosition }).y;
            
            // Create image shape positioned above input box with original aspect ratio
            editor.createShapes([{
              type: 'image',
              x: startX + offsetX,
              y: canvasY,
              props: {
                assetId,
                w: displayWidth,
                h: displayHeight,
              },
            }]);
            
          } catch (error) {
            console.error('Failed to create image shape:', error);
            // Fallback to text shape if image creation fails
            const viewportCenter = editor.getViewportScreenCenter();
            
            // Use existing images count for consistent positioning
            const existingImages = editor.getCurrentPageShapes()
              .filter(shape => shape.type === 'image' || shape.type === 'text')
              .length;
            
            // Position text above input box (same as image positioning)
            const inputHeight = 48;
            const inputBottomMargin = 24;
            const textSpacing = 20;
            const textHeight = 50;
            const textWidth = 200; // Width for text fallback
            const horizontalSpacing = Math.max(textWidth + 20, 320); // Minimum spacing of 320px
            
            const offsetX = existingImages * horizontalSpacing;
            const startX = viewportCenter.x - (textWidth / 2); // Center text properly
            
            // Position right above input box (screen coordinates)
            const screenHeight = window.innerHeight;
            const yPosition = screenHeight - inputBottomMargin - inputHeight - textSpacing - textHeight;
            
            // Convert screen coordinates to canvas coordinates
            const canvasY = editor.screenToPage({ x: 0, y: yPosition }).y;
            
            editor.createShapes([{
              type: 'text',
              x: startX + offsetX,
              y: canvasY,
              props: {
                text: `Generated: ${fileName}`,
                size: 'm',
              },
            }]);
          }
        },
        onTextChunk: (text) => {
          console.log('AI response:', text)
        },
      })
    }
    
    try {
      await attemptGeneration()
      
      // Clear the prompt after successful generation
      setPrompt('')
      
      // Clear selected shapes (this will also clear attached images)
      editor.selectNone()
    } catch (error: unknown) {
      console.error('Generation failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image. Please try again.';
      
      if (onError) {
        onError(errorMessage, () => {
          // Retry function
          handleGenerate()
        })
      } else {
        // Fallback to alert if no error handler provided
        alert(errorMessage)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void handleGenerate()
  }

  return (
    <div className="tldraw-input-positioned">
      <div className={`enhanced-input-container ${attachedImages.length > 0 ? 'has-attached-images' : ''}`}>
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleChange}
          onSubmit={handleSubmit}
          disabled={isGenerating}
        />
        
        {/* Attached Images as overlay chips inside input area */}
        {attachedImages.length > 0 && (
          <div className="attached-images-overlay">
            {attachedImages.map((image) => (
              <div key={image.id} className="attached-image-chip">
                <div className="attached-image-preview">
                  <img 
                    src={image.dataUrl} 
                    alt={image.name}
                    className="attached-image-mini"
                  />
                </div>
                <button
                  className="attached-image-chip-remove"
                  onClick={() => removeAttachedImage(image.id)}
                  title="Remove attached image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
