const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const port = 3000;

//middleware para entender JSON (necesario para guardar archivos de texto)
app.use(express.json());

//servir archivos estáticos del proyecto
app.use(express.static(__dirname));

//servir específicamente la carpeta 'home' para que el navegador pueda acceder a los videos/musica
app.use('/home', express.static(path.join(__dirname, 'home')));

//ruta 1: Obtener lista de archivos en la carpeta 'home'
app.get('/api/files', (req, res) => {
    const homeDir = path.join(__dirname, 'home');

    //si la carpeta no existe, la crea automáticamente
    if (!fs.existsSync(homeDir)) {
        fs.mkdirSync(homeDir);
    }

    fs.readdir(homeDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error leyendo la carpeta home' });
        }
        res.json(files);
    });
});

//ruta 2: guardar cambios en un archivo de texto
app.post('/api/save', (req, res) => {
    const { filename, content } = req.body;
    //seguridad básica: evitar que guarden fuera de 'home'
    const cleanFilename = path.basename(filename);
    const filePath = path.join(__dirname, 'home', cleanFilename);

    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
            return res.status(500).send('Error al guardar el archivo.');
        }
        console.log(`> Archivo guardado: ${cleanFilename}`);
        res.send('Data Saved Successfully.');
    });
});

//ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//iniciar servidor
app.listen(port, () => {
    console.log(`> Acceso: http://localhost:${port}`);
    console.log(`> Sincronizando carpeta: ${path.join(__dirname, 'home')}`);
});