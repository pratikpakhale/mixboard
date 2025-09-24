

import { 
  GoogleGenAI,
  createUserContent
} from '@google/genai';

// Browser-compatible MIME type mapping
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'text/plain': 'txt',
  'application/pdf': 'pdf',
  'application/json': 'json',
};

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get API key from localStorage:', error);
    return null;
  }
}

export function setStoredApiKey(apiKey: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Failed to store API key in localStorage:', error);
    throw new Error('Failed to save API key');
  }
}

export function removeStoredApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove API key from localStorage:', error);
  }
}

export function hasStoredApiKey(): boolean {
  return !!getStoredApiKey();
}


function getFileExtension(mimeType: string): string {
  return MIME_EXTENSIONS[mimeType] || 'bin';
}

// Browser-compatible file download function
function downloadFile(fileName: string, data: string, mimeType: string) {
  try {
    // Convert base64 to binary
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob and download
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`File ${fileName} downloaded successfully.`);
  } catch (error) {
    console.error(`Error downloading file ${fileName}:`, error);
  }
}

export interface AttachedImage {
  dataUrl: string;
  name: string;
}

export interface GenerateContentOptions {
  prompt: string;
  apiKey?: string;
  attachedImages?: AttachedImage[];
  onTextChunk?: (text: string) => void;
  onImageGenerated?: (fileName: string, mimeType: string, imageData: string) => void;
  skipDownload?: boolean; // Option to skip automatic download
}

export async function generateContent(options: GenerateContentOptions) {
  const storedApiKey = getStoredApiKey();
  const { prompt, apiKey = storedApiKey, attachedImages = [], onTextChunk, onImageGenerated, skipDownload = false } = options;
  
  if (!apiKey) {
    throw new Error('No API key available. Please configure your Google Gemini API key.');
  }
  
  const ai = new GoogleGenAI({
    apiKey,
  });
  
  const config = {
    responseModalities: [
      'IMAGE',
      'TEXT',
    ],
  };
  
  const model = 'gemini-2.5-flash-image-preview';
  
  // Build content parts - start with the text prompt
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: prompt }
  ];
  
  // Add attached images to the content
  for (const attachedImage of attachedImages) {
    try {
      // Extract base64 data and MIME type from data URL
      const [mimeTypePart, base64Data] = attachedImage.dataUrl.split(',');
      const mimeType = mimeTypePart.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      
      if (base64Data) {
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    } catch (error) {
      console.error('Failed to process attached image:', attachedImage.name, error);
    }
  }
  
  const contents = [
    createUserContent(parts)
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    
    const generationId = Date.now();
    let imageIndex = 0;
    
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const fileName = `generated_image_${generationId}_${imageIndex++}`;
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const fileExtension = getFileExtension(inlineData.mimeType || '');
        const fullFileName = `${fileName}.${fileExtension}`;
        
        // Only download if skipDownload is false
        if (!skipDownload) {
          downloadFile(fullFileName, inlineData.data || '', inlineData.mimeType || '');
        }
        onImageGenerated?.(fullFileName, inlineData.mimeType || '', inlineData.data || '');
      } else if (chunk.text) {
        console.log(chunk.text);
        onTextChunk?.(chunk.text);
      }
    }
  } catch (error: unknown) {
    console.error('Error generating content:', error);
    
    // Enhanced error handling with more specific error messages
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message?.includes('API_KEY_INVALID') || 
        error.message?.includes('Invalid API key')) {
      errorMessage = 'Invalid API key. Please update your Google Gemini API key in settings.';
    } else if (error.message?.includes('quota') || error.status === 429) {
      errorMessage = 'API quota exceeded. Please check your usage limits or try again later.';
    } else if (error.message?.includes('PERMISSION_DENIED') || error.status === 403) {
      errorMessage = 'Permission denied. Please ensure your API key has the necessary permissions.';
    } else if (error.name === 'NetworkError' || error.message?.includes('fetch') || error.message?.includes('network')) {
      errorMessage = 'Network connection error. Please check your internet connection and try again.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. The server took too long to respond. Please try again.';
    } else if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. The service is temporarily unavailable. Please try again later.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Create a more informative error object
    const enhancedError = new Error(errorMessage) as Error & {
      originalError?: unknown;
      status?: number;
    };
    enhancedError.name = (error instanceof Error ? error.name : undefined) || 'GenerationError';
    enhancedError.originalError = error;
    enhancedError.status = (error as { status?: number }).status;
    
    throw enhancedError;
  }
}