import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';
import { validateImageFile, optimizeImage } from '../middleware/upload.js';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ File type validation — приймаємо всі стандартні формати зображень
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/tiff',
  'image/bmp'
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB per file
const MAX_FILES_COUNT = 20; // Maximum 20 images per product
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total per upload request

// Configure file upload middleware — ✅ auth required
router.use(authenticate);
router.use(authorize(Role.ADMIN));
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(), // ✅ Cross-platform compatible
  limits: {
    fileSize: MAX_FILE_SIZE,
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

  try {
    // ✅ Validate Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary credentials missing');
      return res.status(500).json({
        error: 'Cloudinary не налаштовано',
      });
    }

    // Collect all files from request
    const files: Array<{
      name: string;
      tempFilePath: string;
      mimetype: string;
      size: number;
    }> = [];

    const fieldNames = ['files', 'file', 'image', 'images'];
    const fileValidationErrors: string[] = [];

    for (const fieldName of fieldNames) {
      const fieldFiles = req.files?.[fieldName];
      if (fieldFiles) {
        const fileArray = Array.isArray(fieldFiles) ? fieldFiles : [fieldFiles];
        for (const f of fileArray as any[]) {
          const fileName = f.name || `upload_${Date.now()}`;

          // ✅ Validate MIME type (м'яка перевірка)
          if (!ALLOWED_MIME_TYPES.includes(f.mimetype)) {
            fileValidationErrors.push(`${fileName}: непідтримуваний тип ${f.mimetype}. Дозволені: JPG, PNG, WebP, HEIC та інші формати зображень`);
            continue;
          }
          // ✅ Validate file size
          if (f.size > MAX_FILE_SIZE) {
            fileValidationErrors.push(`${fileName}: файл занадто великий (${(f.size / 1024 / 1024).toFixed(1)}MB, макс. ${(MAX_FILE_SIZE / 1024 / 1024)}MB)`);
            continue;
          }
          files.push({
            name: fileName,
            tempFilePath: f.tempFilePath,
            mimetype: f.mimetype,
            size: f.size,
          });
        }
      }
    }

    // Return validation errors if any files were rejected
    if (fileValidationErrors.length > 0 && files.length === 0) {
      return res.status(400).json({
        error: 'Жоден файл не пройшов перевірку',
        details: fileValidationErrors,
      });
    }

    // Validate files
    if (files.length === 0) {
      console.error('❌ No files found in request');
      return res.status(400).json({
        error: 'Файли не знайдено. Використовуйте formData.append("files", file)',
      });
    }

    // ✅ Validate max files count
    if (files.length > MAX_FILES_COUNT) {
      return res.status(400).json({
        error: `Занадто багато файлів. Максимум ${MAX_FILES_COUNT} зображень на товар`,
      });
    }

    // ✅ Validate total upload size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return res.status(400).json({
        error: `Загальний розмір файлів занадто великий: ${(totalSize / 1024 / 1024).toFixed(1)}MB (макс. ${(MAX_TOTAL_SIZE / 1024 / 1024)}MB)`,
      });
    }

    console.log(`✅ Processing ${files.length} file(s), total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB...`);

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

      let optimizedPath: string | null = null;

      try {
        // Перевіряємо чи це валідне зображення через Sharp
        const validation = await validateImageFile(file.tempFilePath);
        if (!validation.valid) {
          throw new Error(validation.error || 'Файл не є валідним зображенням');
        }

        // Check if temp file exists
        if (!fs.existsSync(file.tempFilePath)) {
          throw new Error(`Тимчасовий файл не знайдено`);
        }

        // Оптимізуємо зображення
        optimizedPath = await optimizeImage(file.tempFilePath);

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload(
            optimizedPath!,
            {
              folder: 'goodsxp-products',
              resource_type: 'image',
              public_id: `product_${Date.now()}_${i}`,
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
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

      } catch (uploadError: any) {
        console.error(`❌ Upload failed for ${fileName}:`, uploadError.message);
        errors.push({
          fileName,
          error: uploadError.message,
        });
      } finally {
        // Clean up temp files
        try {
          if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
            fs.unlinkSync(file.tempFilePath);
          }
          if (optimizedPath && fs.existsSync(optimizedPath)) {
            fs.unlinkSync(optimizedPath);
          }
        } catch (e) {
          console.warn(`⚠️ Could not delete temp file`);
        }
      }
    }

    console.log(`🎉 Upload completed: ${uploadResults.length} success, ${errors.length} errors`);

    // Return response with detailed error information
    const response: any = {
      success: uploadResults.length > 0,
      urls: uploadResults.map(r => r.url),
      files: uploadResults.map(r => ({
        url: r.url,
        public_id: r.public_id,
        originalName: r.originalName,
      })),
      count: uploadResults.length,
      total: files.length,
      message: `Успішно завантажено ${uploadResults.length} з ${files.length} зображень`,
    };

    // Add validation errors if any
    if (fileValidationErrors.length > 0) {
      response.validationErrors = fileValidationErrors;
    }

    // Add upload errors if any
    if (errors.length > 0) {
      response.uploadErrors = errors;
      response.message += `. Помилки: ${errors.length}`;
    }

    res.json(response);

  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({
      error: 'Помилка завантаження',
    });
  }
});

export default router;
