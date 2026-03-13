import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import fs from 'fs';

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
  abortOnLimit: true,
}));

/**
 * POST /api/upload
 * Upload one or multiple images to Cloudinary
 * 
 * Request: formData.append("files", file) or formData.append("file", file)
 * Response: { success: true, urls: [...], files: [...] }
 */
router.post('/', async (req, res) => {
  console.log('📤 Upload request received');
  console.log('📋 Files:', req.files ? Object.keys(req.files) : 'none');

  try {
    // Validate Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary credentials missing');
      return res.status(500).json({
        error: 'Cloudinary не налаштовано',
        message: 'Перевірте змінні оточення CLOUDINARY_*',
      });
    }

    // Collect all files from request
    // Support multiple field names: 'files', 'file', 'image', 'images'
    const files: Array<{
      name: string;
      tempFilePath: string;
      mimetype: string;
      size: number;
    }> = [];

    const fieldNames = ['files', 'file', 'image', 'images'];

    for (const fieldName of fieldNames) {
      const fieldFiles = req.files?.[fieldName];
      if (fieldFiles) {
        const fileArray = Array.isArray(fieldFiles) ? fieldFiles : [fieldFiles];
        files.push(...fileArray.map((f: any) => ({
          name: f.name || `upload_${Date.now()}`,
          tempFilePath: f.tempFilePath,
          mimetype: f.mimetype,
          size: f.size,
        })));
        console.log(`📁 Found ${fileArray.length} file(s) in '${fieldName}' field`);
      }
    }

    // Validate files
    if (files.length === 0) {
      console.error('❌ No files found in request');
      return res.status(400).json({
        error: 'No files provided',
        message: 'Файли не знайдено. Використовуйте formData.append("files", file)',
        receivedFields: req.files ? Object.keys(req.files) : [],
      });
    }

    console.log(`✅ Processing ${files.length} file(s)...`);

    // Upload all files to Cloudinary
    const uploadResults: Array<{
      url: string;
      public_id: string;
      originalName: string;
    }> = [];

    const errors: Array<{
      fileName: string;
      error: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;

      console.log(`⬆️ Uploading ${i + 1}/${files.length}: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      try {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          throw new Error(`Файл "${fileName}" не є зображенням (type: ${file.mimetype})`);
        }

        // Check if temp file exists
        if (!fs.existsSync(file.tempFilePath)) {
          throw new Error(`Тимчасовий файл не знайдено: ${file.tempFilePath}`);
        }

        // Upload to Cloudinary
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
              if (error) reject(error);
              else resolve(result);
            }
          );
        });

        uploadResults.push({
          url: result.secure_url,
          public_id: result.public_id,
          originalName: fileName,
        });

        console.log(`✅ Uploaded: ${fileName} → ${result.secure_url}`);

        // Clean up temp file
        try {
          fs.unlinkSync(file.tempFilePath);
        } catch (e) {
          console.warn(`⚠️ Could not delete temp file: ${file.tempFilePath}`);
        }

      } catch (uploadError: any) {
        console.error(`❌ Upload failed for ${fileName}:`, uploadError.message);
        errors.push({
          fileName,
          error: uploadError.message,
        });

        // Clean up temp file on error
        try {
          fs.unlinkSync(file.tempFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    console.log(`🎉 Upload completed: ${uploadResults.length} success, ${errors.length} errors`);

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
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({
      error: error.message || 'Помилка завантаження',
      message: 'Не вдалося завантажити файл',
    });
  }
});

export default router;
