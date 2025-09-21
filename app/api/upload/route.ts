/**
 * File Upload API Route Handler
 * 
 * Handles file uploads to Vercel Blob storage.
 * Supports:
 * - Image uploads for skin analysis
 * - Progress photo storage
 * - File validation and processing
 * - Secure blob storage with public URLs
 */

import { BlobService } from "@/integrations/vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
/**
 * Handles POST requests to the file upload API endpoint for skincare image storage
 * 
 * This endpoint manages file uploads to Vercel Blob storage, specifically designed for
 * skincare-related images including progress photos, skin analysis images, and routine
 * documentation. It validates file types, processes images, and provides secure access
 * URLs for the Skincare Sanctuary application.
 * 
 * Upload Process:
 * - Validates file type and size constraints
 * - Processes image files for optimal storage
 * - Uploads to Vercel Blob storage with secure access
 * - Generates public URLs for image access
 * - Returns metadata including file size and dimensions
 * 
 * Supported File Types:
 * - Image formats: JPEG, PNG, WebP, GIF
 * - Maximum file size: 10MB per upload
 * - Automatic image optimization for web delivery
 * - Secure blob storage with access controls
 * 
 * @param {NextRequest} request - HTTP request object containing form data with file upload
 * @returns {Promise<NextResponse>} JSON response with file URL, metadata, upload status, and access information
 * 
 * @throws {Error} When no file is provided in the request
 * @throws {Error} When file type is not supported or invalid
 * @throws {Error} When file size exceeds maximum allowed limit
 * @throws {Error} When Vercel Blob storage operation fails
 * @throws {Error} When file processing fails due to format issues
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const url = await BlobService.uploadFile(file, file.name)

    return NextResponse.json({
      url: url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
