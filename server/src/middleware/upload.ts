import fileUpload from 'express-fileupload';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './errorHandler.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
  tempFileDir: '/tmp/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.name.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return true;
    }
    throw new AppError('Дозволені тільки зображення (JPEG, PNG, WebP)', 400);
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
    console.error('Cloudinary upload error:', error);
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

  // Try Cloudinary first
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const cloudinaryUrl = await uploadToCloudinary(file.tempFilePath);
    if (cloudinaryUrl) {
      // Clean up temp file
      if (fs.existsSync(file.tempFilePath)) {
        fs.unlinkSync(file.tempFilePath);
      }
      return cloudinaryUrl;
    }
  }

  // Fallback to local storage
  const localPath = await saveImageLocally(file);
  
  // Clean up temp file
  if (fs.existsSync(file.tempFilePath)) {
    fs.unlinkSync(file.tempFilePath);
  }
  
  return localPath;
};
