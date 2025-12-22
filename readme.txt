========================================================================
                           PROYECTO: LAIN PAGE
========================================================================

DESCRIPCIÓN:
Este proyecto es una página web interactiva que simula la interfaz del sistema 
operativo "Copland OS Enterprise", visto en el videojuego de la franquicia 
japonesa "Serial Experiments Lain".

El objetivo es recrear la estética "Cyberpunk/Retro" de finales de los 90, 
utilizando tecnologías web modernas para simular un entorno de escritorio 
funcional dentro del navegador.

CARACTERÍSTICAS PRINCIPALES:
1. Interfaz de Ventanas (GUI):
   - Sistema de ventanas arrastrables y flotantes.
   - Funcionalidad de minimizar (al área de notificación superior derecha) y cerrar.
   - Gestión de capas (Z-index): La ventana activa siempre se trae al frente.

2. Aplicaciones Simuladas:
   - [ Chat ]: Simulación de terminal de chat con scroll automático y respuestas programadas.
   - [ Video ]: Reproductor de video integrado con estilo CRT.
   - [ Console ]: Visualizador de audio en tiempo real (Canvas API) sincronizado con música de fondo.
   - [ Terminal ]: Ventana de texto con estética de comandos de sistema.

3. Barra de Tareas y Menús:
   - Menú desplegable "AI lain Pass" para abrir/seleccionar aplicaciones.
   - Reloj en tiempo real sincronizado con el sistema local.
   - Barra de tareas dinámica: Las ventanas minimizadas se convierten en botones interactivos.

4. Estética Visual:
   - Efecto "Scanlines" superpuesto en toda la pantalla.
   - Paleta de colores similares a las vistas en la serie.
   - Tipografía retro (VT323).

REQUISITOS:
Para ejecutar este proyecto localmente, necesitas tener instalado:
- Node.js (Entorno de ejecución).

INSTALACIÓN Y EJECUCIÓN:
Este proyecto utiliza un servidor local con Express para gestionar la carga de 
recursos multimedia (audio/video) y evitar bloqueos de seguridad (CORS).

1. Abre la terminal en la carpeta del proyecto.
2. Instala las dependencias necesarias (solo la primera vez):
   npm install

3. Inicia el servidor local:
   node server.js

4. Abre tu navegador y visita la dirección:
   http://localhost:3000

NOTAS DE USO:
* AUDIO: Debido a las políticas de seguridad de los navegadores modernos, 
  el audio y el visualizador no comenzarán automáticamente. Debes hacer 
  CLIC en cualquier parte de la página una vez para iniciar la reproducción.

* CONTROLES:
  - Arrastrar: Mantén presionado el botón izquierdo sobre la barra azul de cualquier ventana.
  - Minimizar: Clic en el botón [_] de la ventana. Se moverá a la barra superior derecha.
  - Restaurar: Clic en el nombre de la ventana en la barra superior o desde el menú "AI lain Pass".

TECNOLOGÍAS:
- HTML5 & CSS3 (Flexbox, CSS Variables, Animations).
- JavaScript (Vanilla JS, Web Audio API, Canvas API).
- Backend: Node.js + Express.