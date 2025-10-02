import { encodeImageFromUrl } from "@/utils/encodeImageFromUrl"
import { ProcessedMessage, MessageProcessingResult } from "./types/api"

/**
 * Processes chat messages to handle image references and convert them to proper format
 */
export async function processMessages(messages: any[]): Promise<MessageProcessingResult> {
  const processedMessages: ProcessedMessage[] = []
  const imagesForLaterStorage: string[] = []

  for (const message of messages) {
    if (message.role === "user" && typeof message.content === "string" && message.content.includes("[IMAGE:")) {
      const imageRegex = /\[IMAGE:\s*([^\]]+)\]/g
      const imageRefs: string[] = []
      let m
      while ((m = imageRegex.exec(message.content)) !== null) {
        imageRefs.push(m[1].trim())
      }

      const textContent = message.content.replace(imageRegex, "").trim()

      // Keep originals for storage later
      for (const ref of imageRefs) {
        imagesForLaterStorage.push(ref)
      }

      const contentParts: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = []

      if (textContent) {
        contentParts.push({ type: "text", text: textContent })
      }

      for (const ref of imageRefs) {
        try {
          if (ref.startsWith("data:image/")) {
            // Already encoded - use directly
            contentParts.push({ type: "image", image: ref })
          } else if (/^https?:\/\//i.test(ref)) {
            // Convert HTTPS to data URL on server
            const { dataUrl } = await encodeImageFromUrl(ref)
            contentParts.push({ type: "image", image: dataUrl })
          } else if (ref.startsWith("blob:")) {
            console.warn("[v0] Skipping blob: URL on server; encode on client or upload to storage first.")
          } else {
            console.warn("[v0] Unrecognized image ref, skipping:", ref)
          }
        } catch (err) {
          console.error("[v0] Error encoding image:", err)
        }
      }

      if (contentParts.length > 0) {
        processedMessages.push({
          role: "user",
          content: contentParts,
        })
      } else {
        processedMessages.push({
          role: message.role,
          content: [{ type: "text", text: textContent || "Please analyze these photos of my skin." }],
        })
      }
    } else {
      processedMessages.push({
        role: message.role,
        content: [{ type: "text", text: String(message.content ?? "") }],
      })
    }
  }

  return { processedMessages, imagesForLaterStorage }
}
