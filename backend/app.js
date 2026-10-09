// Charge les variables d'environnement depuis le fichier .env.
require('dotenv').config();
// Importe Express pour créer et configurer l'application serveur.
const express = require('express');
// Importe CORS pour autoriser les requêtes provenant d'une autre origine,
// par exemple celles envoyées par le frontend React.
const cors = require('cors');
// Importe Mongoose pour communiquer avec la base de données MongoDB.
const mongoose = require('mongoose');
// Importe les routes liées à l'inscription et à la connexion des utilisateurs.
const userRoutes = require('./routes/user');
// Importe les routes liées aux livres : affichage, ajout, modification, etc.
const bookRoutes = require('./routes/book');
// Crée l'application Express qui gérera les requêtes HTTP.
const app = express();

app.use(cors());
// Permet à Express de lire automatiquement les corps des requêtes au format JSON.
app.use(express.json());
// Rend le dossier "images" accessible publiquement via l'URL /images.
// Cela permet au frontend d'afficher les images des livres.
app.use('/images', express.static('images'));
// Associe les routes d'authentification au préfixe /api/auth.
// Les chemins définis dans userRoutes seront ajoutés à ce préfixe.
app.use('/api/auth', userRoutes);
// Associe les routes des livres au préfixe /api/books.
app.use('/api/books', bookRoutes);
// Établit la connexion à MongoDB grâce à l'URL stockée dans le fichier .env.
// Le mot de passe et les informations de connexion restent ainsi hors du code.
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((error) => console.error('Connexion à MongoDB échouée :', error));
// Définit une route GET à la racine du serveur.
// Elle sert principalement à vérifier que l'application Express répond.
app.get('/', (req, res) => {
    res.send('Voilà la réponse du serveur Express !');
});

module.exports = app;