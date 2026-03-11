import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/upload
 * 
 * Accepts one or multiple image files via FormData
 * Uploads to Cloudinary and returns array of URLs
 * 
 * Request:
 * - FormData with field 'files' (multiple) or 'file' (single)
 * 
 * Response:
 * - success: boolean
 * - urls: string[] (Cloudinary URLs)
 * - count: number
 */
export async function POST(request: NextRequest) {
  console.log('📤 Upload request received')

  try {
    // Validate Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary credentials missing:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
      })
      return NextResponse.json(
        {
          error: 'Cloudinary не налаштовано',
          details: 'Перевірте змінні оточення: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
        },
        { status: 500 }
      )
    }

    // Parse FormData
    console.log('📦 Parsing FormData...')
    const formData = await request.formData()

    // Collect all files from request
    const files: File[] = []

    // Try 'files' field first (for multiple files)
    const filesField = formData.getAll('files')
    for (const item of filesField) {
      if (item instanceof File) {
        files.push(item)
      }
    }

    // If no files in 'files', try 'file' field (for single file backward compatibility)
    if (files.length === 0) {
      const fileField = formData.get('file')
      if (fileField instanceof File) {
        files.push(fileField)
      }
    }

    // If still no files, try 'image' field (alternative)
    if (files.length === 0) {
      const imageField = formData.getAll('image')
      for (const item of imageField) {
        if (item instanceof File) {
          files.push(item)
        }
      }
    }

    // Validate that we have files
    if (files.length === 0) {
      console.error('❌ No files found in request')
      const receivedKeys = Array.from(formData.keys())
      return NextResponse.json(
        {
          error: 'No files provided',
          message: 'Файли не знайдено. Переконайтеся що файл обрано та відправлено через FormData.',
          receivedFields: receivedKeys,
        },
        { status: 400 }
      )
    }

    console.log(`✅ Found ${files.length} file(s) to upload`)

    // Upload all files to Cloudinary
    const uploadResults: Array<{
      url: string
      public_id: string
      originalName: string
      size: number
    }> = []

    const errors: Array<{
      fileName: string
      error: string
    }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = file.name || `file_${i}`
      const fileSize = file.size

      console.log(`⬆️ Uploading file ${i + 1}/${files.length}: ${fileName} (${formatBytes(fileSize)})`)

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`Файл "${fileName}" не є зображенням (type: ${file.type})`)
        }

        // Validate file size (max 10MB)
        if (fileSize > 10 * 1024 * 1024) {
          throw new Error(`Файл "${fileName}" завеликий (${formatBytes(fileSize)}, макс. 10MB)`)
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Convert to base64 for Cloudinary upload
        const b64 = buffer.toString('base64')
        const dataUri = `data:${file.type};base64,${b64}`

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload(
            dataUri,
            {
              folder: 'goodsxp-products',
              resource_type: 'image',
              public_id: `product_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`,
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
        })

        uploadResults.push({
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          originalName: fileName,
          size: fileSize,
        })

        console.log(`✅ Uploaded: ${fileName} → ${uploadResult.secure_url}`)

      } catch (uploadError: any) {
        console.error(`❌ Upload failed for ${fileName}:`, uploadError.message)
        errors.push({
          fileName,
          error: uploadError.message,
        })
      }
    }

    // Log summary
    console.log(`🎉 Upload completed: ${uploadResults.length} success, ${errors.length} errors`)

    // Return response
    return NextResponse.json({
      success: uploadResults.length > 0,
      urls: uploadResults.map(r => r.url),
      files: uploadResults.map(r => ({
        url: r.url,
        public_id: r.public_id,
        originalName: r.originalName,
      })),
      count: uploadResults.length,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error('❌ Upload error:', error.message)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }

    return NextResponse.json(
      {
        error: error.message || 'Помилка завантаження',
        message: 'Не вдалося завантажити файл(и) на Cloudinary',
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
