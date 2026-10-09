const mongoose = require('mongoose');
// Importe le plugin mongoose-unique-validator.
// Il permet de vérifier qu'une valeur déclarée comme unique,
// comme l'adresse e-mail, n'est pas déjà utilisée.
const uniqueValidator = require('mongoose-unique-validator').default;
// Définit le schéma d'un utilisateur et les règles de validation de ses données.
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    }

});

// Ajoute le plugin de validation au schéma.
// Il permet notamment de produire une erreur de validation plus explicite
// lorsqu'une adresse e-mail existe déjà.
userSchema.plugin(uniqueValidator);

// Crée le modèle User à partir du schéma.
// Ce modèle permet de créer et de rechercher des utilisateurs dans MongoDB.
const User = mongoose.model('User', userSchema);

module.exports = User;