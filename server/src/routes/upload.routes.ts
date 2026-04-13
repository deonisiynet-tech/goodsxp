import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ File type validation — MIME types + magic bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// SVG allowed but handled separately (text-based, needs extra validation)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 🔒 Validate file by magic bytes (file signature) — not just client-supplied MIME.
 * Checks first bytes of file against known image signatures.
 */
function validateFileMagic(filePath: string, fileName: string): { valid: boolean; error?: string } {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'Файл не знайдено' };
    }

    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const ext = path.extname(fileName).toLowerCase();

    // Validate extension is allowed
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Непідтримуваний тип файлу: ${ext}` };
    }

    // Check magic bytes
    if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG: starts with FF D8 FF
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        return { valid: false, error: 'Файл не є дійсним JPEG зображенням' };
      }
    } else if (ext === '.png') {
      // PNG: 89 50 4E 47
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
        return { valid: false, error: 'Файл не є дійсним PNG зображенням' };
      }
    } else if (ext === '.webp') {
      // WebP: starts with "RIFF" and has "WEBP" at offset 8
      const riff = buffer.toString('ascii', 0, 4);
      const webp = buffer.toString('ascii', 8, 12);
      if (riff !== 'RIFF' || webp !== 'WEBP') {
        return { valid: false, error: 'Файл не є дійсним WebP зображенням' };
      }
    } else if (ext === '.gif') {
      // GIF: 47 49 46 38
      if (buffer[0] !== 0x47 || buffer[1] !== 0x49 || buffer[2] !== 0x46 || buffer[3] !== 0x38) {
        return { valid: false, error: 'Файл не є дійсним GIF зображенням' };
      }
    } else if (ext === '.svg') {
      // SVG: text-based — validate content doesn't contain scripts
      const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
      if (content.includes('<script') || content.includes('javascript:') || content.includes('onerror=')) {
        return { valid: false, error: 'SVG файли з JavaScript заборонені' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Помилка перевірки файлу' };
  }
}

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

    for (const fieldName of fieldNames) {
      const fieldFiles = req.files?.[fieldName];
      if (fieldFiles) {
        const fileArray = Array.isArray(fieldFiles) ? fieldFiles : [fieldFiles];
        for (const f of fileArray as any[]) {
          // ✅ Validate MIME type (client-supplied, additional check)
          if (!ALLOWED_MIME_TYPES.includes(f.mimetype) && f.mimetype !== 'image/svg+xml') {
            return res.status(400).json({
              error: `Непідтримуваний тип файлу: ${f.mimetype}. Дозволені: JPEG, PNG, WebP, GIF, SVG`,
            });
          }
          // ✅ Validate file size
          if (f.size > MAX_FILE_SIZE) {
            return res.status(400).json({
              error: `Файл занадто великий: ${(f.size / 1024 / 1024).toFixed(1)}MB (макс. ${(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
            });
          }
          files.push({
            name: f.name || `upload_${Date.now()}`,
            tempFilePath: f.tempFilePath,
            mimetype: f.mimetype,
            size: f.size,
          });
        }
      }
    }

    // Validate files
    if (files.length === 0) {
      console.error('❌ No files found in request');
      // 🔒 SECURITY: Don't leak internal field names
      return res.status(400).json({
        error: 'Файли не знайдено. Використовуйте formData.append("files", file)',
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
        // 🔒 Validate magic bytes before processing
        const magicCheck = validateFileMagic(file.tempFilePath, fileName);
        if (!magicCheck.valid) {
          throw new Error(magicCheck.error || 'Файл не пройшов перевірку');
        }

        // Check if temp file exists
        if (!fs.existsSync(file.tempFilePath)) {
          throw new Error(`Тимчасовий файл не знайдено`);
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
          console.warn(`⚠️ Could not delete temp file`);
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
      error: 'Помилка завантаження',
    });
  }
});

export default router;
