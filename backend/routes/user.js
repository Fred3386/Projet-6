const express = require('express');
// Importe bcrypt pour hacher les mots de passe et vérifier leur validité.
const bcrypt = require('bcrypt');
// Importe le modèle User pour interagir avec les utilisateurs dans MongoDB.
const User = require('../models/User');
// Importe jsonwebtoken pour générer des tokens d'authentification JWT.
const jwt = require('jsonwebtoken');
// Crée un routeur Express pour regrouper les routes d'authentification.
const router = express.Router();

// Route POST /signup : permet de créer un nouveau compte utilisateur.
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Hache le mot de passe avec bcrypt.
        const hash = await bcrypt.hash(password, 10);
        // Crée un nouvel utilisateur avec son e-mail et son mot de passe haché.
        const user = new User({
            email: email,
            password: hash
        });
        // Enregistre le nouvel utilisateur dans la base de données MongoDB.
        await user.save();
        // Renvoie le statut HTTP 201 pour indiquer que le compte a été créé.
        res.status(201).json({
            message: 'Inscription réussie'
        });
    } catch (error) {
        // En cas d'erreur pendant l'inscription, renvoie une réponse HTTP 500.
        res.status(500).json({ error: error.message });
    }
});


// Route POST /login : permet à un utilisateur de se connecter.
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Recherche dans MongoDB un utilisateur correspondant à cette adresse e-mail.
    const user = await User.findOne({ email });
    // Si aucun utilisateur n'est trouvé, renvoie une erreur HTTP 401.
    if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    // Compare le mot de passe fourni avec le hash enregistré en base de données.
    // bcrypt effectue la comparaison sans avoir besoin de déchiffrer le hash.
    const valid = await bcrypt.compare(password, user.password);
    // Si les mots de passe ne correspondent pas, refuse la connexion.
    if (!valid) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    // Génère un token JWT contenant l'identifiant de l'utilisateur.
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    // Renvoie une réponse HTTP 200 avec l'identifiant de l'utilisateur
    // et le token nécessaire pour accéder aux routes protégées.
    res.status(200).json({
        userId: user._id,
        token: token
    });
});

module.exports = router;