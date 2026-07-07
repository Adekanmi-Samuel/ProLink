const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Ensure upload directory exists
const UPLOAD_DIR = process.env.VERCEL 
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure Multer (store file on disk)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-rar-compressed',
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Supported: images, videos, PDFs, documents, spreadsheets, archives.'));
    }
  }
});

// Try Cloudinary upload if configured, otherwise use local fallback
const uploadToCloudinary = async (filePath, resourceType) => {
  try {
    const cloudinary = require('cloudinary').v2;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret || apiKey.startsWith('your_')) {
      return null; // Cloudinary not configured
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder: 'prolink_uploads',
    });
    return result.secure_url;
  } catch (err) {
    console.warn('Cloudinary upload failed, using local fallback:', err.message);
    return null;
  }
};

router.post('/', authMiddleware, uploadLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    // Try Cloudinary, fall back to local
    let fileUrl = await uploadToCloudinary(req.file.path, resourceType);

    if (!fileUrl) {
      // Local fallback — serve from uploads/
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    res.json({
      status: 'success',
      url: fileUrl,
      format: req.file.filename.split('.').pop(),
      original_name: req.file.originalname,
      resource_type: resourceType,
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

module.exports = router;
