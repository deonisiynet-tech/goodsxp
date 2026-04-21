import fileUpload from 'express-fileupload';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './errorHandler.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../services/logger.service.js';
import sharp from 'sharp';

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
    fileSize: 15 * 1024 * 1024, // 15MB limit per file
  },
});

/**
 * Конвертує та оптимізує зображення через Sharp
 * Приймає будь-який формат (JPEG, PNG, WebP, HEIC тощо)
 * Повертає оптимізоване JPEG або WebP
 */
export const optimizeImage = async (inputPath: string): Promise<string> => {
  const outputPath = `${inputPath}_optimized.jpg`;

  try {
    await sharp(inputPath)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    logger.error('Image optimization failed', {
      message: 'Sharp optimization failed',
      source: 'SYSTEM' as any,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    throw new AppError('Помилка оптимізації зображення', 500);
  }
};

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return '';
  }

  let optimizedPath: string | null = null;

  try {
    // Оптимізуємо зображення перед завантаженням
    optimizedPath = await optimizeImage(filePath);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        optimizedPath!,
        {
          folder: 'goodsxp-products',
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

    return result.secure_url;
  } catch (error) {
    logger.error('Cloudinary upload failed', {
      message: 'Cloudinary upload failed',
      source: 'SYSTEM' as any,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    return '';
  } finally {
    // Видаляємо оптимізований файл
    if (optimizedPath && fs.existsSync(optimizedPath)) {
      try {
        fs.unlinkSync(optimizedPath);
      } catch (e) {
        // Ігноруємо помилки видалення
      }
    }
  }
};

export const saveImageLocally = async (file: any): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `${uuidv4()}.jpg`;
  const filePath = path.join(uploadsDir, fileName);

  let optimizedPath: string | null = null;

  try {
    // Оптимізуємо зображення
    optimizedPath = await optimizeImage(file.tempFilePath);

    // Копіюємо оптимізоване зображення
    fs.copyFileSync(optimizedPath, filePath);

    return `/uploads/${fileName}`;
  } finally {
    // Видаляємо оптимізований тимчасовий файл
    if (optimizedPath && fs.existsSync(optimizedPath)) {
      try {
        fs.unlinkSync(optimizedPath);
      } catch (e) {
        // Ігноруємо помилки
      }
    }
  }
};

/**
 * Перевіряє чи файл є зображенням через Sharp
 * Sharp автоматично розпізнає всі підтримувані формати
 */
export const validateImageFile = async (filePath: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { valid: false, error: 'Файл не знайдено' };
    }

    // Sharp автоматично перевірить чи це валідне зображення
    const metadata = await sharp(filePath).metadata();

    if (!metadata.format) {
      return { valid: false, error: 'Файл не є зображенням' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Файл не є валідним зображенням або формат не підтримується'
    };
  }
};

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
