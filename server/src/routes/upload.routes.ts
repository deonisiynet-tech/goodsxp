import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import path from 'path';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure file upload middleware
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
}));

/**
 * POST /api/upload
 * Upload one or multiple images to Cloudinary
 */
router.post('/', async (req, res) => {
  console.log('📤 Upload request received on Express server')
  console.log('📋 Request files:', req.files)

  try {
    // Validate Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary credentials missing')
      return res.status(500).json({
        error: 'Cloudinary не налаштовано',
        details: 'Перевірте змінні оточення',
      })
    }

    // Get files from request
    // Can be in req.files.files (array) or req.files.file (single)
    const files: any[] = []

    if (req.files?.files) {
      // Multiple files
      const uploadedFiles = Array.isArray(req.files.files) 
        ? req.files.files 
        : [req.files.files]
      files.push(...uploadedFiles)
      console.log(`📁 Found ${uploadedFiles.length} files in 'files' field`)
    }

    if (files.length === 0 && req.files?.file) {
      // Single file (backward compatibility)
      const uploadedFile = Array.isArray(req.files.file) 
        ? req.files.file 
        : [req.files.file]
      files.push(...uploadedFile)
      console.log(`📁 Found ${uploadedFile.length} file(s) in 'file' field`)
    }

    if (files.length === 0 && req.files?.image) {
      // Alternative field name
      const uploadedFiles = Array.isArray(req.files.image) 
        ? req.files.image 
        : [req.files.image]
      files.push(...uploadedFiles)
      console.log(`📁 Found ${uploadedFiles.length} file(s) in 'image' field`)
    }

    // Validate files
    if (files.length === 0) {
      console.error('❌ No files found in request')
      console.log('📋 All received files:', Object.keys(req.files || {}))
      return res.status(400).json({
        error: 'No files provided',
        message: 'Файли не знайдено',
        receivedFields: req.files ? Object.keys(req.files) : [],
      })
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
        if (!file.mimetype.startsWith('image/')) {
          throw new Error(`Файл "${fileName}" не є зображенням`)
        }

        // Upload to Cloudinary using temp file path
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload(
            file.tempFilePath,
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
          fileName,
          error: uploadError.message,
        })
      }
    }

    console.log(`🎉 Upload completed: ${uploadResults.length} success, ${errors.length} errors`)

    // Return response
    res.json({
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
    res.status(500).json({
      error: error.message || 'Помилка завантаження',
      message: 'Не вдалося завантажити файл',
    })
  }
})

export default router
