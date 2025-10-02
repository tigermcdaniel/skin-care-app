"use client"

import type React from "react"
import { ImageIcon, X } from "lucide-react"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"

interface ChatInputProps {
  input: string
  setInput: (input: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  selectedImages: File[]
  imagePreviews: string[]
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  quickCommands?: string[]
  onQuickCommand?: (command: string) => void
  showQuickCommands?: boolean
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  selectedImages,
  imagePreviews,
  onImageSelect,
  onRemoveImage,
  fileInputRef,
  quickCommands = [],
  onQuickCommand,
  showQuickCommands = false,
}: ChatInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  return (
    <div className="bg-white border-t border-stone-200 p-2 sm:p-3 md:p-4">
      {showQuickCommands && quickCommands.length > 0 && (
        <div className="mb-2 sm:mb-3 md:mb-4">
          <p className="text-xs text-stone-600 mb-1 sm:mb-2">Quick commands:</p>
          <div className="flex flex-wrap gap-1">
            {quickCommands.map((command, index) => (
              <button
                key={index}
                onClick={() => onQuickCommand?.(command)}
                className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded-full hover:bg-stone-200 transition-colors touch-manipulation"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      )}

      {imagePreviews.length > 0 && (
        <div className="mb-2 sm:mb-3 md:mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview || PLACEHOLDER_IMAGE}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-16 sm:h-20 md:h-24 object-cover rounded-md sm:rounded-lg border border-stone-200"
                />
                <button
                  onClick={() => onRemoveImage(index)}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center touch-manipulation"
                >
                  <X className="w-2 h-2 sm:w-3 sm:h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 md:gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything."
            className="w-full px-2.5 sm:px-3 md:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 md:pr-12 border border-stone-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-sm sm:text-base"
            disabled={isLoading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-1.5 sm:right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-sage-600 transition-colors touch-manipulation p-0.5 sm:p-1"
            disabled={isLoading}
          >
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onImageSelect} className="hidden" />
        </div>
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
          className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 bg-black text-white rounded-md sm:rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-manipulation text-xs sm:text-sm md:text-base"
        >
          Send
        </button>
      </form>
    </div>
  )
}
