const express = require('express');
const router = express.Router();
const fs = require('fs');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const Book = require('../models/Book');

router.get('/',auth, async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error });
    }
});

router.get('/bestrating',auth, async (req, res) => {
    try {
        const books = await Book.find()
        .sort({ averageRating: -1 })
        .limit(3);
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error });
    }
});

router.get('/:id',auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        res.status(200).json(book);

    } catch (error) {
        res.status(400).json({ error: 'ID du livre invalide' });
    }
});

router.post('/', auth, multer[0], multer[1], async (req, res) => {
    try {
        const bookData = JSON.parse(req.body.book);

        const book = new Book({
            ...bookData,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });

        await book.save();

        res.status(201).json({ message: 'Livre créé !' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id', auth, multer[0], multer[1], async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        if (book.userId !== req.auth.userId) {
            return res.status(403).json({ error: 'unauthorized request' });
        }

        const oldImageUrl = book.imageUrl;

        let updatedBook;

        if (req.body.book) {
            updatedBook = JSON.parse(req.body.book);
        } else {
            updatedBook = {
                ...req.body
            };
        }

        if (req.file) {
            updatedBook.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;

            const oldImagePath = oldImageUrl.replace(
                `${req.protocol}://${req.get('host')}/`,
                ''
            );

            await fs.promises.unlink(oldImagePath);
        }

        await Book.findByIdAndUpdate(req.params.id, updatedBook);

        res.status(200).json({ message: 'Livre modifié !' });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        if (book.userId !== req.auth.userId) {
            return res.status(403).json({ error: 'unauthorized request' });
        }

        const imageUrl = book.imageUrl;

        const imagePath = imageUrl.replace(
            `${req.protocol}://${req.get('host')}/`,
            ''
        );

        try {
            await fs.promises.unlink(imagePath);
        } catch (error) {
            console.error('Erreur lors de la suppression de l’image :', error);
        }

        await Book.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Livre supprimé !' });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/:id/rating', auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        const rating = Number(req.body.rating);

        if (rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'La note doit être comprise entre 0 et 5' });
        }

        const alreadyRated = book.ratings.some(
            (rating) => rating.userId === req.auth.userId
        );

        if (alreadyRated) {
            return res.status(400).json({ error: 'Vous avez déjà noté ce livre' });
        }

        book.ratings.push({
            userId: req.auth.userId,
            grade: rating
        });

        const total = book.ratings.reduce(
            (sum, rating) => sum + rating.grade,
            0
        );

        book.averageRating = total / book.ratings.length;

        await book.save();

        res.status(201).json(book);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;