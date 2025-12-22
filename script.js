document.addEventListener("DOMContentLoaded", () => {

    const windows = document.querySelectorAll('.draggable-window');
    const taskbarArea = document.getElementById('taskbar-area');
    let highestZ = 100;

    // === BOOT SCREEN LOGIC ===
    const bootScreen = document.getElementById('boot-screen');
    const audioPlayer = document.getElementById('audio-player');

    // Al hacer clic en la pantalla de carga, iniciar sistema y audio
    bootScreen.addEventListener('click', () => {
        bootScreen.style.opacity = '0';
        setTimeout(() => {
            bootScreen.style.display = 'none';
        }, 1000);

        // Iniciar audio
        initAudio();
        // Intentar reproducir video si está cargado
        const video = document.querySelector('.video-player');
        if (video) video.play().catch(e => console.log("Video autoplay blocked"));
    });

    // === WINDOWS LOGIC ===
    windows.forEach(win => {
        win.addEventListener('mousedown', () => bringToFront(win));
        const titleBar = win.querySelector('.title-bar');
        dragElement(win, titleBar);

        const closeBtn = win.querySelector('.close-btn');
        const minBtn = win.querySelector('.minimize-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                win.style.display = 'none';
                toggleMedia(win, false);
            });
        }
        if (minBtn) {
            minBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                minimizeWindow(win);
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
        toggleMedia(win, false);

        const winId = win.id;
        // Obtenemos el texto real sin el data-text del glitch si es necesario
        const winTitle = win.querySelector('.title').innerText;

        const taskItem = document.createElement('div');
        taskItem.className = 'taskbar-item';
        taskItem.innerText = winTitle;
        taskItem.id = 'task-' + winId;
        taskItem.onclick = () => restoreWindow(win, taskItem);
        taskbarArea.appendChild(taskItem);

        setTimeout(() => {
            win.style.display = 'none';
        }, 300);
    }

    function restoreWindow(win, taskItem) {
        if (taskItem) taskItem.remove();
        win.style.display = 'flex';
        bringToFront(win);
        setTimeout(() => {
            win.classList.remove('minimizing');
            toggleMedia(win, true);
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

    function toggleMedia(win, play) {
        const media = win.querySelectorAll('video');
        media.forEach(m => {
            if (play) m.play().catch(() => console.log('Autoplay blocked'));
            else m.pause();
        });
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

    // === SYSTEM FUNCTIONS ===
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString('en-US', { hour12: false });
    }, 1000);

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
                const response = document.createElement('p');
                response.innerHTML = `<span style="color: var(--lain-cyan);">[ Lain ]</span> ... I am everywhere.`;
                chatHistory.appendChild(response);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 1000);
        }
    }

    // === TERMINAL LOGIC (NUEVO) ===
    const termInput = document.getElementById('term-input');
    const termLog = document.querySelector('.term-log');
    const termContent = document.getElementById('term-output');

    // Enfocar input al hacer clic en la ventana
    document.getElementById('win-terminal').addEventListener('click', () => {
        termInput.focus();
    });

    termInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const command = this.value.toLowerCase().trim();
            printToTerminal(`user@wired:~$ ${this.value}`); // Echo del comando

            // Comandos disponibles
            switch (command) {
                case 'help':
                    printToTerminal("COMMANDS: help, clear, whoami, lain, date, exit");
                    break;
                case 'clear':
                    termLog.innerHTML = "";
                    break;
                case 'whoami':
                    printToTerminal("User: Guest / Protocol: 7 / Layer: Physical");
                    break;
                case 'lain':
                    printToTerminal("Let's all love Lain.");
                    break;
                case 'date':
                    printToTerminal(new Date().toString());
                    break;
                case 'exit':
                    document.getElementById('win-terminal').style.display = 'none';
                    break;
                default:
                    if (command !== "") printToTerminal(`Command '${command}' not found.`);
            }
            this.value = ""; // Limpiar input
            termContent.scrollTop = termContent.scrollHeight; // Scroll al fondo
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

    // Se llama desde el boot screen
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

        // Si no se reprodujo antes, reproducir ahora
        if (audioPlayer.paused) audioPlayer.play().catch(e => console.log(e));

        function draw() {
            requestAnimationFrame(draw);
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
        draw();
    }
});

// Utility functions global scope
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