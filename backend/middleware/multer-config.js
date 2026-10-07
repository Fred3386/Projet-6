const multer = require('multer');
const sharp = require('sharp');

const storage = multer.memoryStorage();

const upload = multer({ storage }).single('image');

const optimizeImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const name = req.file.originalname
            .split(' ')
            .join('_')
            .split('.')[0];

        const filename = name + Date.now() + '.webp';

        await sharp(req.file.buffer)
            .resize(800)
            .webp({ quality: 80 })
            .toFile(`images/${filename}`);

        req.file.filename = filename;

        next();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = [upload, optimizeImage];