import fileUpload from 'express-fileupload';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './errorHandler.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../services/logger.service.js';

const logger = new LoggerService();

// Configure Cloudinary (optional)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const uploadMiddleware = fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(), // Крос-платформний тимчасовий каталог
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return '';
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        {
          folder: 'goodsxp-products',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    return result.secure_url;
  } catch (error) {
    logger.error('Cloudinary upload failed', {
      message: 'Cloudinary upload failed',
      source: 'SYSTEM' as any,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    return '';
  }
};

export const saveImageLocally = async (file: any): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 🔒 SECURITY: Only allow safe image extensions — never .js, .php, .html etc.
  const ext = path.extname(file.name).toLowerCase();
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new AppError('Непідтримуваний тип файлу', 400);
  }

  // 🔒 Use UUID + safe extension (ignore original filename to prevent path traversal)
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  // 🔒 Validate magic bytes before saving locally
  const magicCheck = validateFileMagic(file.tempFilePath, file.name);
  if (!magicCheck.valid) {
    throw new AppError(magicCheck.error || 'Файл не пройшов перевірку', 400);
  }

  return new Promise((resolve, reject) => {
    file.mv(filePath, (err: any) => {
      if (err) reject(err);
      else resolve(`/uploads/${fileName}`);
    });
  });
};

/**
 * 🔒 Magic bytes validator — reused from upload.routes.ts
 */
function validateFileMagic(filePath: string, fileName: string): { valid: boolean; error?: string } {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { valid: false, error: 'Файл не знайдено' };
    }

    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const ext = path.extname(fileName).toLowerCase();

    if (ext === '.jpg' || ext === '.jpeg') {
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        return { valid: false, error: 'Файл не є дійсним JPEG зображенням' };
      }
    } else if (ext === '.png') {
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
        return { valid: false, error: 'Файл не є дійсним PNG зображенням' };
      }
    } else if (ext === '.webp') {
      const riff = buffer.toString('ascii', 0, 4);
      const webp = buffer.toString('ascii', 8, 12);
      if (riff !== 'RIFF' || webp !== 'WEBP') {
        return { valid: false, error: 'Файл не є дійсним WebP зображенням' };
      }
    } else if (ext === '.gif') {
      if (buffer[0] !== 0x47 || buffer[1] !== 0x49 || buffer[2] !== 0x46 || buffer[3] !== 0x38) {
        return { valid: false, error: 'Файл не є дійсним GIF зображенням' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Помилка перевірки файлу' };
  }
}

export const processImageUpload = async (file: any): Promise<string> => {
  if (!file) return '';

  try {
    // Try Cloudinary first
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const cloudinaryUrl = await uploadToCloudinary(file.tempFilePath);
      if (cloudinaryUrl) {
        return cloudinaryUrl;
      }
    }

    // Fallback to local storage
    const localPath = await saveImageLocally(file);
    return localPath;
  } finally {
    // Гарантоване очищення тимчасового файлу
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      try {
        fs.unlinkSync(file.tempFilePath);
      } catch (e) {
        // Ігноруємо помилки видалення temp файлу
      }
    }
  }
};
