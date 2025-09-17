"use client"

import type React from "react"
import { ImageIcon } from "lucide-react"
import { PLACEHOLDER_IMAGE } from "@/app/features/shared/constants/assets"

interface ChatInputProps {
  input: string
  setInput: (input: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  selectedImage: File | null
  imagePreview: string | null
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
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
  selectedImage,
  imagePreview,
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
    <div className="bg-white border-t border-stone-200 p-4">
      {showQuickCommands && quickCommands.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-stone-600 mb-2">Quick commands:</p>
          <div className="flex flex-wrap gap-2">
            {quickCommands.map((command, index) => (
              <button
                key={index}
                onClick={() => onQuickCommand?.(command)}
                className="px-3 py-1 text-sm bg-stone-100 text-stone-700 rounded-full hover:bg-stone-200 transition-colors"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      )}

      {imagePreview && (
        <div className="mb-4 relative inline-block">
          <img
            src={imagePreview || PLACEHOLDER_IMAGE}
            alt="Preview"
            className="max-w-32 max-h-32 rounded-lg border border-stone-200"
          />
          <button
            onClick={onRemoveImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me about your skincare routine, products, or concerns..."
            className="w-full px-4 py-3 pr-12 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-sage-600 transition-colors"
            disabled={isLoading}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageSelect} className="hidden" />
        </div>
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !selectedImage)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
