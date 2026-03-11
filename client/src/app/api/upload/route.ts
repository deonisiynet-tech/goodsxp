import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload one or multiple images to Cloudinary
 * 
 * Request:
 * - FormData with field 'files' (one or multiple File objects)
 * - OR field 'file' (single File object) for backward compatibility
 * 
 * Response:
 * - success: boolean
 * - urls: string[] (array of Cloudinary URLs)
 * - count: number (number of uploaded files)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('📤 Upload request received')

  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error('❌ Cloudinary credentials not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudinary не налаштовано. Перевірте змінні оточення.',
          debug: {
            hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
            hasApiKey: !!process.env.CLOUDINARY_API_KEY,
            hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
          }
        },
        { status: 500 }
      )
    }

    // Parse FormData
    console.log('📦 Parsing FormData...')
    const formData = await request.formData()
    
    // Get all files from 'files' field (multiple files)
    let files: File[] = []
    
    // Try 'files' field first (multiple files)
    const filesField = formData.getAll('files')
    if (filesField && filesField.length > 0) {
      files = filesField.filter((item): item is File => item instanceof File)
      console.log(`📁 Found ${files.length} file(s) in 'files' field`)
    }
    
    // If no files in 'files' field, try 'file' field (single file)
    if (files.length === 0) {
      const fileField = formData.get('file')
      if (fileField instanceof File) {
        files = [fileField]
        console.log(`📁 Found 1 file in 'file' field`)
      }
    }
    
    // If still no files, try 'image' field (alternative)
    if (files.length === 0) {
      const imageField = formData.getAll('image')
      if (imageField && imageField.length > 0) {
        files = imageField.filter((item): item is File => item instanceof File)
        console.log(`📁 Found ${files.length} file(s) in 'image' field`)
      }
    }

    // Validate files
    if (files.length === 0) {
      console.error('❌ No files found in request')
      return NextResponse.json(
        {
          success: false,
          error: 'Файли не знайдено. Перевірте що файл обрано та поле називається "files" або "file".',
          receivedFields: Array.from(formData.keys()),
        },
        { status: 400 }
      )
    }

    console.log(`✅ Processing ${files.length} file(s)...`)

    // Upload all files to Cloudinary
    const uploadResults: Array<{ url: string; public_id: string; originalName: string }> = []
    const errors: Array<{ name: string; error: string }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = file.name || `file_${i}`
      
      console.log(`⬆️ Uploading file ${i + 1}/${files.length}: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`Файл "${fileName}" не є зображенням (type: ${file.type})`)
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Файл "${fileName}" завеликий (${(file.size / 1024 / 1024).toFixed(2)} MB, макс. 10 MB)`)
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Convert buffer to base64 for Cloudinary upload
        const b64 = buffer.toString('base64')
        const dataUri = `data:${file.type};base64,${b64}`

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
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
          url: result.secure_url,
          public_id: result.public_id,
          originalName: fileName,
        })

        console.log(`✅ Uploaded: ${fileName} → ${result.secure_url}`)

      } catch (uploadError: any) {
        console.error(`❌ Upload failed for ${fileName}:`, uploadError.message)
        errors.push({
          name: fileName,
          error: uploadError.message,
        })
      }
    }

    // Log summary
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`🎉 Upload completed in ${uploadTime}s: ${uploadResults.length} success, ${errors.length} errors`)

    // Return results
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
      debug: {
        uploadTime: `${uploadTime}s`,
        totalFiles: files.length,
        successfulUploads: uploadResults.length,
        failedUploads: errors.length,
      }
    })

  } catch (error: any) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error('❌ Upload error:', error)
    console.error('Stack:', error.stack)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Помилка завантаження зображення',
        debug: {
          totalTime: `${totalTime}s`,
        }
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
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
