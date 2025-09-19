import { put } from "@vercel/blob"

// Vercel Blob integration for file uploads
export class BlobService {
  static async uploadFile(file: File, filename?: string): Promise<string> {
    try {
      const blob = await put(filename || file.name, file, {
        access: "public",
        addRandomSuffix: true,
      })
      return blob.url
    } catch (error) {
      console.error("Error uploading file to Vercel Blob:", error)
      throw new Error("Failed to upload file")
    }
  }

  static async uploadBuffer(buffer: Buffer, filename: string): Promise<string> {
    try {
      const blob = await put(filename, buffer, {
        access: "public",
        addRandomSuffix: true,
      })
      return blob.url
    } catch (error) {
      console.error("Error uploading buffer to Vercel Blob:", error)
      throw new Error("Failed to upload file")
    }
  }
}
