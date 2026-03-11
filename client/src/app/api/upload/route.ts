import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не знайдено' },
        { status: 400 }
      )
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cloudinary не налаштовано. Перевірте змінні оточення.' 
        },
        { status: 500 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      // Convert buffer to base64 for upload
      const b64 = buffer.toString('base64')
      const dataUri = `data:${file.type};base64,${b64}`

      cloudinary.uploader.upload(
        dataUri,
        {
          folder: 'goodsxp-products',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Помилка завантаження зображення' 
      },
      { status: 500 }
    )
  }
}
