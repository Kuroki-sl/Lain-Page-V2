document.addEventListener("DOMContentLoaded", () => {
    const windows = document.querySelectorAll('.draggable-window');
    const taskbarArea = document.getElementById('taskbar-area');
    let highestZ = 100;
    let currentEditingFile = "";

    // === BOOT SCREEN LOGIC ===
    const bootScreen = document.getElementById('boot-screen');
    const audioPlayer = document.getElementById('audio-player');

    bootScreen.addEventListener('click', () => {
        bootScreen.style.opacity = '0';
        setTimeout(() => bootScreen.style.display = 'none', 1000);

        // Iniciar el sistema de glitch aleatorio
        triggerRandomGlitch();

        initAudio();
        // Intentar autoinicio de video si existe
        const vid = document.querySelector('.video-player');
        if (vid) {
            vid.muted = true; // Asegurar que inicie muteado
            vid.play().catch(e => console.log("Video blocked"));
        }
    });

    // === SISTEMA DE GLITCH ALEATORIO ===
    // Esta función se llama a sí misma para crear un bucle infinito
    function triggerRandomGlitch() {
        const glitchElements = document.querySelectorAll('.glitch');
        if (glitchElements.length > 0) {
            // 1. Elegir un título al azar
            const randomEl = glitchElements[Math.floor(Math.random() * glitchElements.length)];

            // 2. Activar el efecto (añadir clase CSS)
            randomEl.classList.add('glitch-active');

            // 3. Quitar el efecto después de un tiempo corto (0.3 a 0.8 segundos)
            setTimeout(() => {
                randomEl.classList.remove('glitch-active');
            }, 300 + Math.random() * 500);
        }

        // 4. Programar el siguiente glitch (entre 2 y 6 segundos después)
        setTimeout(triggerRandomGlitch, 2000 + Math.random() * 4000);
    }

    // === GESTIÓN DE VENTANAS ===
    windows.forEach(win => {
        win.addEventListener('mousedown', () => bringToFront(win));
        const titleBar = win.querySelector('.title-bar');
        dragElement(win, titleBar);

        const closeBtn = win.querySelector('.close-btn');
        const minBtn = win.querySelector('.minimize-btn');
        const muteVidBtn = win.querySelector('.video-mute-btn'); // Botón específico del video

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                win.style.display = 'none';
                toggleMedia(win, false); // Detiene video Y audio al cerrar
            });
        }
        if (minBtn) {
            minBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                minimizeWindow(win);
            });
        }
        // Lógica del botón de mute en la barra del video
        if (muteVidBtn) {
            muteVidBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const vid = win.querySelector('video');
                if (vid) {
                    vid.muted = !vid.muted;
                    // Cambiar color para indicar estado
                    muteVidBtn.style.background = vid.muted ? '#1c5285' : 'var(--lain-cyan)';
                    muteVidBtn.style.color = vid.muted ? 'black' : 'black';
                }
            });
        }
    });

    function bringToFront(win) {
        highestZ++;
        win.style.zIndex = highestZ;
    }

    function minimizeWindow(win) {
        highestZ += 10;
        win.style.zIndex = highestZ;
        win.classList.add('minimizing');
        toggleMedia(win, false); // Pausar todo al minimizar

        const winId = win.id;
        // Obtener título limpio (sin atributos de data)
        let winTitle = "Window";
        const titleEl = win.querySelector('.title');
        if (titleEl.hasAttribute('data-text')) {
            winTitle = titleEl.getAttribute('data-text');
        } else {
            winTitle = titleEl.innerText;
        }

        const taskItem = document.createElement('div');
        taskItem.className = 'taskbar-item';
        taskItem.innerText = winTitle;
        taskItem.id = 'task-' + winId;
        taskItem.onclick = () => restoreWindow(win, taskItem);
        taskbarArea.appendChild(taskItem);

        setTimeout(() => win.style.display = 'none', 300);
    }

    function restoreWindow(win, taskItem) {
        if (taskItem) taskItem.remove();
        win.style.display = 'flex';
        bringToFront(win);
        setTimeout(() => {
            win.classList.remove('minimizing');
            toggleMedia(win, true); // Reanudar al restaurar
        }, 10);
    }

    window.openWindow = function (windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;
        if (win.style.display === 'none' || win.classList.contains('minimizing')) {
            const taskItem = document.getElementById('task-' + windowId);
            restoreWindow(win, taskItem);
        } else {
            bringToFront(win);
            win.style.transform = "scale(1.02)";
            setTimeout(() => win.style.transform = "scale(1)", 150);
        }
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    };

    // Función para pausar/reproducir medios (Video y Audio)
    function toggleMedia(win, play) {
        // Seleccionamos tanto <video> como <audio> dentro de la ventana
        const media = win.querySelectorAll('video, audio');
        media.forEach(m => {
            if (play) m.play().catch(() => { });
            else m.pause();
        });
    }

    // === SISTEMA DE ARCHIVOS ===
    window.loadFiles = function () {
        fetch('/api/files')
            .then(res => res.json())
            .then(files => {
                const container = document.getElementById('file-list');
                container.innerHTML = "";
                if (files.length === 0) {
                    container.innerHTML = "<p style='width:100%'>Directory empty.</p>";
                    return;
                }
                files.forEach(file => {
                    const div = document.createElement('div');
                    div.className = 'file-item';
                    let icon = "📄";
                    // Iconos según extensión
                    if (file.endsWith('.mp3')) icon = "🎵";
                    else if (file.endsWith('.mp4')) icon = "🎞️";
                    else if (file.endsWith('.txt')) icon = "📝";
                    else if (file.match(/\.(jpg|jpeg|png|gif)$/i)) icon = "🖼️";

                    div.innerHTML = `<span class="file-icon">${icon}</span><span class="file-name">${file}</span>`;
                    div.onclick = () => openFile(file);
                    container.appendChild(div);
                });
            })
            .catch(err => console.error(err));
    }

    function openFile(filename) {
        const filePath = "/home/" + filename;

        if (filename.endsWith('.mp4')) {
            openWindow('win-video');
            const video = document.querySelector('#win-video video');
            video.src = filePath;
            video.muted = true;
            video.play();
        }
        else if (filename.endsWith('.mp3')) {
            openWindow('win-console');
            const audio = document.getElementById('audio-player');
            audio.src = filePath;
            audio.play();
            if (!isAudioInit) initAudio();
        }
        else if (filename.endsWith('.txt')) {
            openWindow('win-notepad');
            currentEditingFile = filename;
            document.getElementById('notepad-title').innerText = `[ Edit: ${filename} ]`;
            fetch(filePath).then(res => res.text()).then(text => {
                document.getElementById('notepad-content').value = text;
            });
        }
        else if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
            openWindow('win-image');
            const imgDisplay = document.getElementById('image-display');
            const imgTitle = document.getElementById('image-title');
            imgDisplay.src = filePath;
            imgTitle.setAttribute('data-text', `[ View: ${filename} ]`);
            imgTitle.innerText = `[ View: ${filename} ]`;
        }
    }

    // Guardar archivo (Notepad)
    document.getElementById('save-btn').addEventListener('click', () => {
        const content = document.getElementById('notepad-content').value;
        if (!currentEditingFile) return;
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: currentEditingFile, content: content })
        })
            .then(res => res.text())
            .then(msg => alert("System: " + msg))
            .catch(err => alert("Error saving data."));
    });

    // === TERMINAL ===
    const termInput = document.getElementById('term-input');
    const termLog = document.querySelector('.term-log');
    const termContent = document.getElementById('term-output');

    document.getElementById('win-terminal').addEventListener('click', () => termInput.focus());

    termInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const command = this.value.toLowerCase().trim();
            printToTerminal(`user@wired:~$ ${this.value}`);

            switch (command) {
                case 'help':
                    printToTerminal("COMMANDS: help, clear, whoami, lain, date, exit, close the world");
                    break;
                case 'clear': termLog.innerHTML = ""; break;
                case 'whoami': printToTerminal("User: Guest / Protocol: 7 / Layer: Physical"); break;
                case 'lain': printToTerminal("Let's all love Lain."); break;
                case 'date': printToTerminal(new Date().toString()); break;
                case 'exit': document.getElementById('win-terminal').style.display = 'none'; break;

                // EASTER EGG
                case 'close the world':
                    printToTerminal("INITIATING PROTOCOL...");
                    setTimeout(() => {
                        document.body.style.transition = "filter 3s, transform 3s";
                        document.body.style.filter = "invert(1) hue-rotate(180deg) contrast(1.5)";
                        document.body.style.transform = "scale(1.1)";
                        document.querySelectorAll('div, p, span').forEach(el => {
                            if (el.children.length === 0 && el.innerText.trim().length > 0)
                                el.innerText = "NO MATTER WHERE YOU ARE, EVERYONE IS ALWAYS CONNECTED";
                        });
                    }, 1500);
                    break;

                default: if (command) printToTerminal(`Command '${command}' not found.`);
            }
            this.value = "";
            termContent.scrollTop = termContent.scrollHeight;
        }
    });

    function printToTerminal(text) {
        const p = document.createElement('p');
        p.innerText = text;
        termLog.appendChild(p);
    }

    // === AUDIO VISUALIZER ===
    const canvas = document.getElementById('audio-visualizer');
    const ctx = canvas.getContext('2d');
    let audioContext, analyser, source;
    let isAudioInit = false;

    function initAudio() {
        if (isAudioInit) return;
        isAudioInit = true;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Intento de reproducción
        if (audioPlayer.paused && document.getElementById('win-console').style.display !== 'none')
            audioPlayer.play().catch(e => { });

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                let barHeight = dataArray[i] / 2;
                ctx.fillStyle = '#009fe9b4';
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
        draw();
    }

    // Draggable Functionality
    function dragElement(elmnt, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
        function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
    }

    // Chat Logic
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    document.querySelector('.send-btn').addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    function sendMessage() {
        if (chatInput.value.trim() !== "") {
            const p = document.createElement('p');
            p.innerHTML = `<span style="color: yellow;">[ User ]</span> ${chatInput.value}`;
            chatHistory.appendChild(p);
            chatInput.value = "";
            chatHistory.scrollTop = chatHistory.scrollHeight;
            setTimeout(() => {
                const r = document.createElement('p');
                r.innerHTML = `<span style="color: var(--lain-cyan);">[ Lain ]</span> ... I am everywhere.`;
                chatHistory.appendChild(r);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 1000);
        }
    }
});

// Utility Functions
function toggleMenu(id) {
    const menu = document.getElementById(id);
    const isVisible = menu.style.display === 'block';
    document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    if (!isVisible) menu.style.display = 'block';
}
window.onclick = function (event) {
    if (!event.target.matches('.nav-item') && !event.target.matches('.menu-opt')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    }
}
function toggleMute() {
    const audio = document.getElementById('audio-player');
    const btn = document.getElementById('mute-btn');
    audio.muted = !audio.muted;
    btn.innerText = audio.muted ? '🔇' : '🔊';
}