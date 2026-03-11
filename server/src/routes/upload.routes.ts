import { Router } from 'express';
import { uploadMiddleware, processImageUpload } from '../middleware/upload.js';

const router = Router();

/**
 * Upload image to Cloudinary or local storage
 * Returns URL of uploaded image
 */
router.post('/', uploadMiddleware, async (req, res) => {
  try {
    if (!req.files || !(req.files as any).image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = (req.files as any).image;
    
    // Process image upload (Cloudinary or local)
    const imageUrl = await processImageUpload(file);

    if (!imageUrl) {
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    res.json({
      success: true,
      url: imageUrl,
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image',
    });
  }
});

export default router;
