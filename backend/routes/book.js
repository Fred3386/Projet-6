const express = require('express');
const router = express.Router();
const fs = require('fs');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const Book = require('../models/Book');

// Route GET /api/books : récupère tous les livres enregistrés dans MongoDB.
// L'utilisateur doit être authentifié pour accéder à cette route.
router.get('/', auth, async (req, res) => {
    try {
        // Recherche tous les livres dans la base de données.
        const books = await Book.find();
        res.status(200).json(books);
    } catch (error) {
        // Renvoie une erreur HTTP 500 si la récupération échoue.
        res.status(500).json({ error });
    }
});

// Route GET /api/books/bestrating : récupère les trois livres
// ayant la meilleure moyenne de notes.
router.get('/bestrating', auth, async (req, res) => {
    try {
        // Récupère tous les livres, les trie par moyenne décroissante,
        // puis limite le résultat aux trois premiers.
        const books = await Book.find()
            .sort({ averageRating: -1 })
            .limit(3);
        res.status(200).json(books);
    } catch (error) {
        // Renvoie une erreur HTTP 500 en cas d'échec.
        res.status(500).json({ error });
    }
});

// Route GET /api/books/:id : récupère un livre précis grâce à son identifiant.
router.get('/:id', auth, async (req, res) => {
    try {
        // Recherche le livre correspondant à l'identifiant fourni dans l'URL.
        const book = await Book.findById(req.params.id);
        // Si aucun livre ne correspond, renvoie une erreur HTTP 404.
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }
        res.status(200).json(book);
    } catch (error) {
        // Renvoie une erreur HTTP 400 si l'identifiant est invalide
        // ou si une erreur de requête survient.
        res.status(400).json({ error: 'ID du livre invalide' });
    }
});

// Route POST /api/books : crée un nouveau livre.
// L'utilisateur doit être authentifié et peut envoyer une image.
router.post('/', auth, multer[0], multer[1], async (req, res) => {
    try {
        // Vérifie que les informations du livre sont présentes.
        if (!req.body || !req.body.book) {
            return res.status(400).json({
                error: 'Les informations du livre sont obligatoires.'
            });
        }

        // Convertit les données JSON en objet JavaScript.
        let bookData;

        try {
            bookData = JSON.parse(req.body.book);
        } catch (error) {
            return res.status(400).json({
                error: 'Les informations du livre sont invalides.'
            });
        }

        // Vérifie que les données reçues sont bien un objet.
        if (
            !bookData ||
            typeof bookData !== 'object' ||
            Array.isArray(bookData)
        ) {
            return res.status(400).json({
                error: 'Les informations du livre sont invalides.'
            });
        }

        // Stocke toutes les erreurs détectées.
        const errors = {};

        // Vérifie le titre.
        if (
            typeof bookData.title !== 'string' ||
            !bookData.title.trim()
        ) {
            errors.title = 'Le titre du livre est obligatoire.';
        }

        // Vérifie l'auteur.
        if (
            typeof bookData.author !== 'string' ||
            !bookData.author.trim()
        ) {
            errors.author = 'Le nom de l’auteur est obligatoire.';
        }

        // Vérifie l'année de publication.
        let year;

        if (
            !Object.prototype.hasOwnProperty.call(bookData, 'year') ||
            bookData.year === null ||
            String(bookData.year).trim() === ''
        ) {
            errors.year = 'L’année de publication est obligatoire.';
        } else {
            year = Number(bookData.year);

            if (
                !Number.isInteger(year) ||
                year < 1 ||
                year > new Date().getFullYear()
            ) {
                errors.year = 'L’année de publication est invalide.';
            }
        }

        // Vérifie le genre.
        if (
            typeof bookData.genre !== 'string' ||
            !bookData.genre.trim()
        ) {
            errors.genre = 'Le genre du livre est obligatoire.';
        }

        // Vérifie l'image.
        if (!req.file) {
            errors.image = 'Vous devez ajouter une image du livre.';
        }

        // Renvoie toutes les erreurs dans une seule réponse.
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        // Crée le livre avec les données vérifiées.
        const book = new Book({
            ...bookData,
            title: bookData.title.trim(),
            author: bookData.author.trim(),
            year,
            genre: bookData.genre.trim(),
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });

        // Enregistre le livre dans la base de données.
        await book.save();

        return res.status(201).json({
            message: 'Livre créé !'
        });

    } catch (error) {
        console.error(
            'Erreur lors de la création du livre :',
            error
        );

        return res.status(400).json({
            error: 'Une erreur est survenue lors de la création du livre.'
        });
    }
});

// Route PUT /api/books/:id : modifie un livre existant.
// Seul l'utilisateur qui a créé le livre peut le modifier.
router.put('/:id', auth, multer[0], multer[1], async (req, res) => {
    try {
        // Recherche le livre à modifier à partir de son identifiant.
        const book = await Book.findById(req.params.id);
        // Si le livre n'existe pas, renvoie une erreur HTTP 404.
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }
        // Vérifie que l'utilisateur connecté est bien le propriétaire du livre.
        if (book.userId !== req.auth.userId) {
            return res.status(403).json({ error: 'unauthorized request' });
        }
        // Conserve l'URL de l'ancienne image pour pouvoir supprimer le fichier
        // si une nouvelle image est envoyée.
        const oldImageUrl = book.imageUrl;
        let updatedBook;
        // Si les données du livre sont envoyées dans le champ "book",
        // les convertit en objet JavaScript.
        if (req.body.book) {
            updatedBook = JSON.parse(req.body.book);
        } else {
            // Sinon, utilise directement les données reçues dans le corps
            // de la requête.
            updatedBook = {
                ...req.body
            };
        }
        // Si une nouvelle image a été envoyée, met à jour son URL
        // et supprime l'ancien fichier image du serveur.
        if (req.file) {
            updatedBook.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
            const oldImagePath = oldImageUrl.replace(
                `${req.protocol}://${req.get('host')}/`,
                ''
            );
            await fs.promises.unlink(oldImagePath);
        }
        // Met à jour le livre dans MongoDB avec les nouvelles données.
        await Book.findByIdAndUpdate(req.params.id, updatedBook);
        res.status(200).json({ message: 'Livre modifié !' });
    } catch (error) {
        // Renvoie une erreur HTTP 400 si la modification échoue.
        res.status(400).json({ error: error.message });
    }
});

// Route DELETE /api/books/:id : supprime un livre et tente de supprimer son image.
// Seul le propriétaire du livre peut effectuer cette opération.
router.delete('/:id', auth, async (req, res) => {
    try {
        // Recherche le livre à supprimer.
        const book = await Book.findById(req.params.id);
        // Vérifie que le livre existe.
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }
        // Vérifie que l'utilisateur connecté est le propriétaire du livre.
        if (book.userId !== req.auth.userId) {
            return res.status(403).json({ error: 'unauthorized request' });
        }
        // Récupère l'URL de l'image associée au livre.
        const imageUrl = book.imageUrl;
        // Convertit l'URL en chemin relatif vers le fichier image.
        const imagePath = imageUrl.replace(
            `${req.protocol}://${req.get('host')}/`,
            ''
        );

        try {
            // Tente de supprimer le fichier image du serveur.
            await fs.promises.unlink(imagePath);
        } catch (error) {
            // Si la suppression de l'image échoue, affiche l'erreur
            // dans le terminal sans interrompre la suppression du livre.
            console.error('Erreur lors de la suppression de l’image :', error);
        }
        await Book.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Livre supprimé !' });

    } catch (error) {
        // Renvoie une erreur HTTP 400 si une autre étape échoue.
        res.status(400).json({ error: error.message });
    }
});

// Route POST /api/books/:id/rating : permet à un utilisateur connecté
// d'attribuer une note à un livre, puis recalcule sa moyenne.
router.post('/:id/rating', auth, async (req, res) => {
    try {
        // Recherche le livre concerné par la notation.
        const book = await Book.findById(req.params.id);
        // Si le livre n'existe pas, renvoie une erreur HTTP 404.
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }
        // Convertit la note reçue dans le corps de la requête en nombre.
        const rating = Number(req.body.rating);
        // Vérifie que la note est comprise entre 0 et 5 inclus.
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'La note doit être comprise entre 0 et 5' });
        }
        // Vérifie si l'utilisateur connecté a déjà noté ce livre.
        const alreadyRated = book.ratings.some(
            (rating) => rating.userId.toString() === req.auth.userId
        );

        if (alreadyRated) {
            return res.status(400).json({ error: 'Vous avez déjà noté ce livre' });
        }
        // Ajoute la nouvelle note au tableau des notes du livre.
        // L'identifiant provient du token vérifié par le middleware auth.
        book.ratings.push({
            userId: req.auth.userId,
            grade: rating
        });
        // Additionne toutes les notes enregistrées pour ce livre.
        const total = book.ratings.reduce(
            (sum, rating) => sum + rating.grade,
            0
        );
        // Calcule la moyenne en divisant le total des notes
        // par le nombre de notes enregistrées.
        book.averageRating = total / book.ratings.length;
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        // Renvoie une erreur HTTP 400 si la notation échoue.
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
