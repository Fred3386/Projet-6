// Importe le module HTTP natif de Node.js pour créer le serveur.
const http = require('http');

// Importe l'application Express configurée dans app.js.
const app = require('./app');

// Convertit et vérifie la valeur du port pour qu'elle soit utilisable
// par le serveur, qu'elle provienne d'un nombre ou d'un nom de pipe.
const normalizePort = val => {
    const port = parseInt(val, 10);

    // Si la valeur n'est pas un nombre, on conserve sa valeur d'origine.
    if (isNaN(port)) {
        return val;
    }

    // Si le port est positif ou égal à zéro, on le retourne.
    if (port >= 0) {
        return port;
    }

    // Si le port est négatif, la valeur est considérée comme invalide.
    return false;
};

// Définit le port d'écoute : celui de la variable d'environnement PORT
// s'il existe, sinon le port 3000 par défaut.
const port = normalizePort(process.env.PORT || '3000');

// Enregistre le port dans la configuration de l'application Express.
app.set('port', port);

// Gère les erreurs qui peuvent survenir lorsque le serveur démarre.
const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    // Récupère l'adresse sur laquelle le serveur essaie d'écouter.
    const address = server.address();

    // Prépare un texte indiquant le pipe ou le port concerné par l'erreur.
    const bind = typeof address === 'string'
        ? 'pipe ' + address
        : 'port: ' + port;

    // Adapte le message et le comportement selon le type d'erreur.
    switch (error.code) {
        case 'EACCES':
            // Le processus n'a pas les droits nécessaires pour utiliser ce port.
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;

        default:
            // Pour les autres erreurs, on les transmet.
            throw error;
    }
};

// Crée le serveur HTTP en utilisant l'application Express comme gestionnaire
// des requêtes entrantes.
const server = http.createServer(app);

// Associe le gestionnaire d'erreurs aux erreurs du serveur.
server.on('error', errorHandler);

// Exécute cette fonction lorsque le serveur a commencé à écouter.
server.on('listening', () => {
    // Récupère l'adresse d'écoute du serveur.
    const address = server.address();
    const bind = typeof address === 'string'
        ? 'pipe ' + address
        : 'port ' + port;

    console.log('Listening on ' + bind);
});

// Démarre le serveur HTTP sur le port défini précédemment.
server.listen(port);