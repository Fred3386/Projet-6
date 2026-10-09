// Importe la bibliothèque jsonwebtoken pour vérifier les jetons JWT.
const jwt = require('jsonwebtoken');
// Exporte un middleware Express qui vérifie l'identité de l'utilisateur
module.exports = (req, res, next) => {
    try {
        // Récupère le token JWT dans l'en-tête Authorization de la requête.
        // Le format attendu est : "Bearer <token>".
        const token = req.headers.authorization.split(' ')[1];
        // Vérifie la validité du token à l'aide de la clé secrète JWT_SECRET.
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // Stocke l'identifiant de l'utilisateur authentifié dans la requête.
        // Les routes suivantes pourront utiliser req.auth.userId
        req.auth = {
            userId: decodedToken.userId
        };
        next();
    } catch (error) {
        // Si la récupération ou la vérification du token échoue,
        // renvoie une réponse HTTP 401 (non autorisé).
        res.status(401).json({ error: error.message });
    }
};