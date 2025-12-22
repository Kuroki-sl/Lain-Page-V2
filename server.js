const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

// Servir archivos estáticos (html, css, mp3, mp4) desde la carpeta actual
app.use(express.static(__dirname));

// Ruta principal para asegurar que cargue el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar la "señal"
app.listen(port, () => {
    console.log(`>Protocolo Wired iniciado en: http://localhost:${port}`);
});