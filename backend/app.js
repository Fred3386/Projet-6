require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', userRoutes);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((error) => console.error('Connexion à MongoDB échouée :', error));

app.get('/', (req, res) => {
    res.send('Voilà la réponse du serveur Express !');
});

module.exports = app;