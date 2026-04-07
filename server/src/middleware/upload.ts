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

  const fileName = `${uuidv4()}${path.extname(file.name)}`;
  const filePath = path.join(uploadsDir, fileName);

  return new Promise((resolve, reject) => {
    file.mv(filePath, (err: any) => {
      if (err) reject(err);
      else resolve(`/uploads/${fileName}`);
    });
  });
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
