// Importe Multer pour gérer les fichiers envoyés dans les requêtes HTTP.
const multer = require('multer');
// Importe Sharp pour redimensionner et convertir les images.
const sharp = require('sharp');
// Stocke temporairement les fichiers reçus en mémoire,
const storage = multer.memoryStorage();
// Configure Multer pour récupérer un seul fichier envoyé dans le champ "image".
const upload = multer({ storage }).single('image');
// Middleware qui optimise l'image reçue avant de poursuivre le traitement de la requête.
const optimizeImage = async (req, res, next) => {
    try {
        // Si aucune image n'a été envoyée, passe directement au middleware suivant.
        if (!req.file) {
            return next();
        }
        // Récupère le nom original du fichier, remplace les espaces par des underscores
        // et récupère la partie située avant le premier point.
        const name = req.file.originalname
            .split(' ')
            .join('_')
            .split('.')[0];
        // Crée un nom de fichier unique en ajoutant la date actuelle,
        // puis utilise l'extension .webp correspondant au format de sortie.
        const filename = name + Date.now() + '.webp';
        // Traite l'image en mémoire avec Sharp :
        await sharp(req.file.buffer)
            .resize(800)
            .webp({ quality: 80 })
            .toFile(`images/${filename}`);
        // Ajoute le nom du fichier optimisé à req.file
        req.file.filename = filename;
        next();

    } catch (error) {
        // Si une erreur survient pendant le traitement de l'image,
        // renvoie une réponse HTTP 500 avec le message d'erreur.
        res.status(500).json({ error: error.message });
    }
};

module.exports = [upload, optimizeImage];