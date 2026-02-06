const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure profile uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename: user-id-timestamp.ext
        // req.user is populated by authenticate middleware
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
        const fileName = `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

// File filter (Images only)
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const allowedFileTypes = /jpeg|jpg|png|gif|webp|svg|jfif/;
    // Check extension
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        console.error(`❌ Upload Rejected: ${file.originalname} (${file.mimetype})`);
        cb(new Error(`Invalid file type. Uploaded: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP, SVG.`));
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
