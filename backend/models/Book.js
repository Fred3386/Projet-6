// Importe Mongoose pour définir la structure des livres
// et les enregistrer dans la base de données MongoDB.
const mongoose = require('mongoose');
// Définit le schéma d'un livre, c'est-à-dire les champs
// et les règles qui structurent chaque document dans la base de données.
const bookSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: true
    },

    author: {
        type: String,
        required: true
    },

    imageUrl: {
        type: String,
        required: true
    },

    year: {
        type: Number,
        required: true
    },

    genre: {
        type: String,
        required: true
    },

    ratings: [
        {
            userId: {
                type: String,
                required: true
            },

            grade: {
                type: Number,
                required: true
            }
        }
    ],

    averageRating: {
        type: Number,
        default: 0
    }
});
// Crée le modèle Book à partir du schéma.
// Ce modèle permet d'effectuer des opérations sur les livres dans MongoDB.
const Book = mongoose.model('Book', bookSchema);

module.exports = Book;