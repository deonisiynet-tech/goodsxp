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
 */
export async function POST(request: NextRequest) {
  console.log('📤 Upload request received')
  console.log('📋 Headers:', Object.fromEntries(request.headers))

  try {
    // Validate Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary credentials missing')
      return NextResponse.json(
        {
          error: 'Cloudinary не налаштовано',
          details: 'Перевірте змінні оточення',
        },
        { status: 500 }
      )
    }

    // Parse FormData
    console.log('📦 Parsing FormData...')
    const formData = await request.formData()
    
    // Debug: log all form data
    const formDataDebug: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        formDataDebug[key] = {
          type: 'File',
          name: value.name,
          size: value.size,
          mimeType: value.type,
        }
      } else {
        formDataDebug[key] = typeof value
      }
    }
    console.log('📋 FormData contents:', formDataDebug)

    // Collect all files from request
    const files: File[] = []

    // Try 'files' field first (for multiple files)
    const filesField = formData.getAll('files')
    console.log(`🔍 Found ${filesField.length} items in 'files' field`)
    for (const item of filesField) {
      if (item instanceof File) {
        console.log(`  ✅ File: ${item.name} (${item.size} bytes, ${item.type})`)
        files.push(item)
      } else {
        console.log(`  ⚠️ Not a File: ${typeof item}`)
      }
    }

    // If no files in 'files', try 'file' field (for single file)
    if (files.length === 0) {
      console.log('🔍 Trying "file" field...')
      const fileField = formData.get('file')
      if (fileField instanceof File) {
        console.log(`  ✅ File: ${fileField.name} (${fileField.size} bytes)`)
        files.push(fileField)
      } else {
        console.log('  ❌ Not a File')
      }
    }

    // If still no files, try 'image' field (alternative)
    if (files.length === 0) {
      console.log('🔍 Trying "image" field...')
      const imageField = formData.getAll('image')
      for (const item of imageField) {
        if (item instanceof File) {
          console.log(`  ✅ File: ${item.name}`)
          files.push(item)
        }
      }
    }

    // Validate that we have files
    if (files.length === 0) {
      console.error('❌ No files found in request!')
      console.error('📋 Received fields:', Array.from(formData.keys()))
      return NextResponse.json(
        {
          error: 'No files provided',
          message: 'Файли не знайдено. Переконайтеся що файл обрано.',
          receivedFields: Array.from(formData.keys()),
          formDataDebug,
        },
        { status: 400 }
      )
    }

    console.log(`✅ Processing ${files.length} file(s)...`)

    // Upload all files to Cloudinary
    const uploadResults: Array<{
      url: string
      public_id: string
      originalName: string
    }> = []

    const errors: Array<{
      fileName: string
      error: string
    }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = file.name || `file_${i}`

      console.log(`⬆️ Uploading ${i + 1}/${files.length}: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`Файл "${fileName}" не є зображенням`)
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Файл "${fileName}" завеликий`)
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Convert to base64
        const b64 = buffer.toString('base64')
        const dataUri = `data:${file.type};base64,${b64}`

        console.log(`☁️ Uploading to Cloudinary...`)

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload(
            dataUri,
            {
              folder: 'goodsxp-products',
              resource_type: 'image',
              public_id: `product_${Date.now()}_${i}`,
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
        message: 'Не вдалося завантажити файл',
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
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
