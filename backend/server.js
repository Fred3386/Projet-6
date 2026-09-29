const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Voilà la réponse du serveur Express test!');
});

app.listen(process.env.PORT || 3000);