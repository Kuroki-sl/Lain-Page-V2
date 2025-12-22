document.addEventListener("DOMContentLoaded", () => {
    // === VARIABLES DEL SISTEMA ===
    const taskbarArea = document.getElementById('taskbar-area');
    const bootScreen = document.getElementById('boot-screen');
    const audioPlayer = document.getElementById('audio-player');
    const termLog = document.querySelector('.term-log');

    let highestZ = 100;
    let currentEditingFile = "";

    // Estado de carga para sincronización
    let isSystemStarted = false;
    let foundMusic = null;
    let foundVideo = null;

    // Variables de Audio (Visualizer)
    let audioCtx, analyser, source;

    // === LÓGICA DE AUTO-INICIO ===
    function tryAutoStart() {
        if (!isSystemStarted) return;

        // Reproducir Música
        if (foundMusic && audioPlayer.paused) {
            audioPlayer.src = foundMusic;
            audioPlayer.volume = 0.5;
            audioPlayer.play()
                .then(() => initAudioSystem())
                .catch(e => { /* Audio bloqueado o error menor */ });
        }

        // Reproducir Video
        if (foundVideo) {
            const vid = document.querySelector('.video-player');
            if (vid && (vid.paused || vid.currentTime === 0)) {
                vid.src = foundVideo;
                openWindow('win-video');

                // Intentar reproducir con sonido, si falla, silenciar
                vid.muted = true;
                vid.play().catch(() => {
                    vid.muted = true;
                    vid.play().catch(e => { });
                });
            }
        }
    }

    // === SECUENCIA DE ARRANQUE (CLIC DEL USUARIO) ===
    bootScreen.addEventListener('click', () => {
        bootScreen.style.opacity = '0';
        setTimeout(() => bootScreen.style.display = 'none', 1000);

        triggerRandomGlitch();
        initAudioSystem();

        isSystemStarted = true; // Marcar sistema como iniciado
        tryAutoStart();         // Intentar reproducir medios
    });

    // === SISTEMA DE ARCHIVOS ===
    window.loadFiles = function () {
        fetch('/api/files')
            .then(res => res.json())
            .then(files => {
                const container = document.getElementById('file-list');
                container.innerHTML = "";

                // Detección y Configuración de Archivos
                if (files.includes('fondo.jpg')) {
                    document.querySelector('.desktop-background').style.backgroundImage = "url('/home/fondo.jpg')";
                }
                if (files.includes('musica.mp3')) {
                    foundMusic = "/home/musica.mp3";
                }
                if (files.includes('video.mp4')) {
                    foundVideo = "/home/video.mp4";
                }

                // Intentar reproducir si el usuario ya inició sesión
                if (isSystemStarted) {
                    tryAutoStart();
                }

                if (files.length === 0) {
                    container.innerHTML = "<p style='width:100%'>Directory empty.</p>";
                    return;
                }

                // Generar Iconos
                files.forEach(file => {
                    const div = document.createElement('div');
                    div.className = 'file-item';

                    let icon = "📄";
                    const ext = file.split('.').pop().toLowerCase();
                    if (ext === 'mp3') icon = "🎵";
                    else if (ext === 'mp4') icon = "🎞️";
                    else if (['jpg', 'png', 'gif', 'jpeg'].includes(ext)) icon = "🖼️";

                    div.innerHTML = `<span class="file-icon">${icon}</span><span class="file-name">${file}</span>`;
                    div.onclick = () => openFile(file);
                    container.appendChild(div);
                });
            })
            .catch(err => console.error(err));
    };

    // Iniciar escaneo al cargar la página
    loadFiles();

    // === MANEJADORES DE ARCHIVOS ===
    const fileHandlers = {
        mp4: (path) => {
            openWindow('win-video');
            const video = document.querySelector('#win-video video');
            video.src = path;
            video.muted = false;
            video.play().catch(e => { });
        },
        mp3: (path) => {
            openWindow('win-console');
            audioPlayer.src = path;
            audioPlayer.play().then(() => initAudioSystem()).catch(e => { });
        },
        txt: (path, filename) => {
            openWindow('win-notepad');
            currentEditingFile = filename;
            document.getElementById('notepad-title').innerText = `[ Edit: ${filename} ]`;
            fetch(path)
                .then(res => res.text())
                .then(text => document.getElementById('notepad-content').value = text);
        },
        img: (path, filename) => {
            openWindow('win-image');
            const imgDisplay = document.getElementById('image-display');
            const imgTitle = document.getElementById('image-title');
            imgDisplay.src = path;
            const label = `[ View: ${filename} ]`;
            imgTitle.setAttribute('data-text', label);
            imgTitle.innerText = label;
        }
    };

    function openFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const path = `/home/${filename}`;
        const type = ['jpg', 'jpeg', 'png', 'gif'].includes(ext) ? 'img' : ext;

        if (fileHandlers[type]) fileHandlers[type](path, filename);
        else alert("System Error: Unknown format protocol.");
    }

    // === INTERFAZ Y EVENTOS ===
    document.addEventListener('mousedown', (e) => {
        const win = e.target.closest('.draggable-window');
        if (win) bringToFront(win);
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn')) {
            closeWindow(e.target.closest('.draggable-window'));
        }
        else if (e.target.classList.contains('minimize-btn')) {
            minimizeWindow(e.target.closest('.draggable-window'));
        }
        else if (e.target.classList.contains('video-mute-btn')) {
            toggleVideoMute(e.target.closest('.draggable-window'), e.target);
        }
    });

    // Inicializar arrastre
    document.querySelectorAll('.draggable-window').forEach(win => {
        const titleBar = win.querySelector('.title-bar');
        if (titleBar) dragElement(win, titleBar);
    });

    // Funciones de Ventana
    function bringToFront(win) {
        highestZ++;
        win.style.zIndex = highestZ;
    }

    function closeWindow(win) {
        win.style.display = 'none';
        toggleMedia(win, false);
    }

    function minimizeWindow(win) {
        win.classList.add('minimizing');
        toggleMedia(win, false);

        const titleEl = win.querySelector('.title');
        const winTitle = titleEl.getAttribute('data-text') || titleEl.innerText;

        const taskItem = document.createElement('div');
        taskItem.className = 'taskbar-item';
        taskItem.innerText = winTitle;
        taskItem.onclick = () => {
            taskItem.remove();
            win.style.display = 'flex';
            bringToFront(win);
            setTimeout(() => {
                win.classList.remove('minimizing');
                toggleMedia(win, true);
            }, 10);
        };
        taskbarArea.appendChild(taskItem);
        setTimeout(() => win.style.display = 'none', 300);
    }

    function toggleVideoMute(win, btn) {
        const vid = win.querySelector('video');
        if (vid) {
            vid.muted = !vid.muted;
            btn.style.background = vid.muted ? '#1c5285' : 'var(--lain-cyan)';
            btn.style.color = vid.muted ? 'white' : 'black';
        }
    }

    window.openWindow = function (windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        if (win.style.display === 'none' || win.classList.contains('minimizing')) {
            win.style.display = 'flex';
            win.classList.remove('minimizing');
        }
        bringToFront(win);

        // Efecto Pop
        win.style.transform = "scale(1.02)";
        setTimeout(() => win.style.transform = "scale(1)", 150);
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    };

    function toggleMedia(win, shouldPlay) {
        const media = win.querySelectorAll('video, audio');
        media.forEach(m => {
            if (shouldPlay) m.play().catch(() => { });
            else m.pause();
        });
    }

    // === TERMINAL ===
    const termInput = document.getElementById('term-input');
    const termCommands = {
        help: () => printToTerminal("COMMANDS: help, clear, whoami, lain, date, exit, close the world"),
        clear: () => termLog.innerHTML = "",
        whoami: () => printToTerminal("User: Guest / Protocol: 7 / Layer: Physical"),
        lain: () => printToTerminal("Let's all love Lain."),
        date: () => printToTerminal(new Date().toString()),
        exit: () => document.getElementById('win-terminal').style.display = 'none',
        "close the world": () => triggerEasterEgg()
    };

    if (document.getElementById('win-terminal')) {
        document.getElementById('win-terminal').addEventListener('click', () => termInput.focus());
        termInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const inputVal = this.value.toLowerCase().trim();
                printToTerminal(`user@wired:~$ ${this.value}`);

                if (termCommands[inputVal]) termCommands[inputVal]();
                else if (inputVal !== "") printToTerminal(`Command '${inputVal}' not found.`);

                this.value = "";
                termLog.scrollTop = termLog.scrollHeight; // Scroll automático al final
            }
        });
    }

    function printToTerminal(text) {
        const p = document.createElement('p');
        p.innerText = text;
        termLog.appendChild(p);
    }

    function triggerEasterEgg() {
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
    }

    // === NOTEPAD SAVE ===
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const content = document.getElementById('notepad-content').value;
            if (!currentEditingFile) return;
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: currentEditingFile, content: content })
            })
                .then(res => res.text())
                .then(msg => alert(msg))
                .catch(() => alert("Error saving data."));
        });
    }

    // === AUDIO VISUALIZER ===
    function initAudioSystem() {
        if (audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        visualizeAudio();
    }

    function visualizeAudio() {
        if (!analyser) return;
        requestAnimationFrame(visualizeAudio);

        const canvas = document.getElementById('audio-visualizer');
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            let barHeight = dataArray[i] / 2;
            ctx.fillStyle = '#009fe9b4';
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    // === GLITCH & DRAG ===
    function triggerRandomGlitch() {
        const glitchElements = document.querySelectorAll('.glitch');
        if (glitchElements.length > 0) {
            const randomEl = glitchElements[Math.floor(Math.random() * glitchElements.length)];
            randomEl.classList.add('glitch-active');
            setTimeout(() => randomEl.classList.remove('glitch-active'), 300 + Math.random() * 500);
        }
        setTimeout(triggerRandomGlitch, 2000 + Math.random() * 4000);
    }

    function dragElement(elmnt, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            bringToFront(elmnt);
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
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // === CHAT SIMULADO ===
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    if (document.querySelector('.send-btn')) {
        document.querySelector('.send-btn').addEventListener('click', sendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    }

    function sendMessage() {
        if (chatInput.value.trim() === "") return;
        const msg = chatInput.value;
        addChatMsg("[ TomokoSl ]", msg, "green");
        chatInput.value = "";
        setTimeout(() => {
            addChatMsg("[ Lain ]", "... I am everywhere.", "var(--lain-cyan)");
        }, 1000);
    }

    function addChatMsg(user, text, color) {
        const p = document.createElement('p');
        p.innerHTML = `<span style="color: ${color};">${user}</span> ${text}`;
        chatHistory.appendChild(p);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});

// === FUNCIONES GLOBALES (ONCLICK HTML) ===
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
};

function toggleMute() {
    const audio = document.getElementById('audio-player');
    const btn = document.getElementById('mute-btn');
    audio.muted = !audio.muted;
    btn.innerText = audio.muted ? '🔇' : '🔊';
}