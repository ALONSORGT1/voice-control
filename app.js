/* ==========================
   CONFIG
========================== */
const WAKE_WORD = "chip";

// Comandos permitidos (salida final)
const ALLOWED_COMMANDS = new Set([
  "avanzar",
  "retroceder",
  "detener",
  "vuelta derecha",
  "vuelta izquierda",
  "90° derecha",
  "90° izquierda",
  "360° derecha",
  "360° izquierda"
]);

// Endpoint de TU backend (recomendado)
const BACKEND_ENDPOINT = "http://localhost:3000/api/command"; 
// luego para GitHub Pages será: https://TU-BACKEND.onrender.com/api/command

/* ==========================
   FUNCIÓN DE BIENVENIDA - VERSIÓN SIMPLIFICADA Y FUNCIONAL
========================== */
function speakWelcome() {
  if (!('speechSynthesis' in window)) {
    console.log("❌ Speech synthesis no soportado");
    return;
  }

  // Cancelar cualquier síntesis anterior
  window.speechSynthesis.cancel();

  // Texto simple sin marcadores SSML
  const text = `Hola, soy Chip.
  Dime Chip para comenzar y después tu orden, por ejemplo: "avanza" o "gira a la derecha".
  Estoy listo para ayudarte.`;

  const utter = new SpeechSynthesisUtterance(text);

  // Configuración básica
  utter.lang = "es-MX";
  utter.rate = 0.9;
  utter.pitch = 1.1;
  utter.volume = 1;

  utter.onstart = () => {
    console.log("🎤 Chip empezó a hablar");
    muteMicWhileChipSpeaks();
    if (typeof setDebug === 'function') {
      setDebug("🎙️ Escuchando a Chip...");
    }
  };
  
  utter.onerror = (e) => {
    console.error("❌ Error en speech synthesis:", e);
    if (typeof setDebug === 'function') {
      setDebug("Error al reproducir voz: " + e.error);
    }
    isChipSpeaking = false;
  };
  
  utter.onend = () => {
    console.log("✅ Chip terminó de hablar");
    unmuteMicAfterChipSpeaks();
    if (typeof setDebug === 'function') {
      setDebug("Listo para escucharte");
    }
  };

  try {
    window.speechSynthesis.speak(utter);
    console.log("📢 Reproduciendo mensaje de bienvenida...");
  } catch (e) {
    console.error("❌ Error al reproducir:", e);
  }
}

/* ==========================
   FUNCIONES DE RESPUESTA POR VOZ
========================== */
function speakResponse(type, command = "") {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  let text = "";
  const frases = {
    reconocido: [
      "¡Entendido!",
      "¡Perfecto!",
      "¡De acuerdo!",
      "¡Instrucción recibida!",
      "¡Muy bien!"
    ],
    avanzar: [
      "Avanzando",
      "Voy hacia adelante",
      "Moviéndome hacia adelante"
    ],
    retroceder: [
      "Retrocediendo",
      "Voy hacia atrás",
      "Moviéndome hacia atrás"
    ],
    detener: [
      "Deteniéndome",
      "Voy a detenerme",
      "Parando ahora"
    ],
    "vuelta derecha": [
      "Girando a la derecha",
      "Vuelta a la derecha"
    ],
    "vuelta izquierda": [
      "Girando a la izquierda",
      "Vuelta a la izquierda"
    ],
    "90° derecha": [
      "Noventa grados a la derecha",
      "Giro de noventa grados a la derecha"
    ],
    "90° izquierda": [
      "Noventa grados a la izquierda",
      "Giro de noventa grados a la izquierda"
    ],
    "360° derecha": [
      "Giro completo a la derecha",
      "Trescientos sesenta grados a la derecha"
    ],
    "360° izquierda": [
      "Giro completo a la izquierda",
      "Trescientos sesenta grados a la izquierda"
    ],
    no_reconocido: [
      "Lo siento, no entendí la instrucción",
      "No reconocí ese comando, por favor intenta de nuevo",
      "Disculpa, no pude entenderte, ¿podrías repetirlo?",
      "Instrucción no reconocida, intenta otra vez",
      "No comprendí esa orden, por favor repite"
    ],
    despertando: [
      "¡Hola! ¿En qué puedo ayudarte?",
      "Despertando, dime tu orden",
      "Estoy aquí, ¿qué necesitas?"
    ]
  };

  if (type === "reconocido" && command) {
    const confirmacion = frases.reconocido[Math.floor(Math.random() * frases.reconocido.length)];
    const accion = frases[command] ? 
      frases[command][Math.floor(Math.random() * frases[command].length)] : 
      command;
    text = `${confirmacion} ${accion}`;
  } 
  else if (type === "reconocido_simple") {
    text = frases.reconocido[Math.floor(Math.random() * frases.reconocido.length)];
  }
  else if (type === "no_reconocido") {
    text = frases.no_reconocido[Math.floor(Math.random() * frases.no_reconocido.length)];
  }
  else if (type === "despertando") {
    text = frases.despertando[Math.floor(Math.random() * frases.despertando.length)];
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-MX";
  utter.rate = 0.9;
  utter.pitch = 1.1;
  utter.volume = 1;

  utter.onstart = () => {
    console.log(`🎤 Chip hablando: "${text}"`);
    muteMicWhileChipSpeaks();
  };

  utter.onend = () => {
    console.log(`✅ Chip terminó de hablar: "${text}"`);
    unmuteMicAfterChipSpeaks();
  };

  utter.onerror = (e) => {
    console.error("❌ Error al reproducir respuesta:", e);
    isChipSpeaking = false;
  };

  try {
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.error("❌ Error al reproducir respuesta:", e);
  }
}

/* ==========================
   UI ELEMENTS
========================== */
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const modeBadge = document.getElementById("modeBadge");
const transcriptBox = document.getElementById("transcriptBox");
const commandBox = document.getElementById("commandBox");
const debugLine = document.getElementById("debugLine");

const transcriptPreview = document.getElementById("transcriptPreview");
const commandFeedback = document.getElementById("commandFeedback");
const idleTimeDisplay = document.getElementById("idleTimeDisplay");
const waitingFeedback = document.getElementById("waitingFeedback");

const btnStart = document.getElementById("btnStart");
const btnSuspend = document.getElementById("btnSuspend");
const btnStop = document.getElementById("btnStop");
const btnClear = document.getElementById("btnClear");

const idleSecondsInput = document.getElementById("idleSeconds");
const langSelect = document.getElementById("langSelect");

document.getElementById("year").textContent = new Date().getFullYear();

/* ==========================
   STATE
========================== */
let isListening = false;
let isSuspended = false;
let manualStop = false;
let lastProcessedCommand = "";
let isChipSpeaking = false;
let shouldResumeAfterSpeak = false;

let idleTimer = null;
let lastHeardAt = Date.now();

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;

/* ==========================
   FUNCIONES DE CONTROL DE MICRÓFONO
========================== */
function muteMicWhileChipSpeaks() {
  isChipSpeaking = true;

  // Si estaba escuchando, lo pausamos y marcamos que debe volver
  if (recognizer && isListening) {
    shouldResumeAfterSpeak = true;
    try { recognizer.stop(); } catch {}
  } else {
    shouldResumeAfterSpeak = false;
  }
}

function unmuteMicAfterChipSpeaks() {
  isChipSpeaking = false;

  // Reinicia el contador desde que Chip terminó de hablar
  lastHeardAt = Date.now();
  resetIdleTimer();

  // Reanuda si se pausó por Chip (y no fue stop manual)
  if (shouldResumeAfterSpeak && !manualStop) {
    shouldResumeAfterSpeak = false;
    setTimeout(() => startRecognizer(), 250);
  }
}

/* ==========================
   FUNCIONES DE ACTUALIZACIÓN VISUAL MEJORADAS
========================== */
function setStatus(mode, text) {
  statusDot.classList.remove("listening", "suspended", "stopped");
  if (mode === "LISTENING") statusDot.classList.add("listening");
  if (mode === "SUSPENDED") statusDot.classList.add("suspended");
  if (mode === "STOPPED") statusDot.classList.add("stopped");

  statusText.textContent = text;
  modeBadge.textContent = mode;
}

function setDebug(msg) {
  debugLine.textContent = msg;
}

function normalizeText(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function showTranscript(text) {
  transcriptBox.textContent = text || "—";
  
  if (transcriptPreview) {
    transcriptPreview.textContent = text || "Esperando tu orden...";
  }
}

function showCommand(text) {
  commandBox.textContent = text || "—";
  updateCommandFeedback(text);
  
  // Respuesta por voz según el resultado (solo si no está hablando ya)
  if (!isChipSpeaking) {
    if (text && text !== "—" && text !== "Orden no reconocida") {
      if (text !== lastProcessedCommand) {
        lastProcessedCommand = text;
        speakResponse("reconocido", text);
      }
    } else if (text === "Orden no reconocida") {
      if (text !== lastProcessedCommand) {
        lastProcessedCommand = text;
        speakResponse("no_reconocido");
      }
    }
  }
}

function updateCommandFeedback(command) {
  if (!commandFeedback) return;
  
  if (command && command !== "—" && command !== "Orden no reconocida") {
    const commandName = command.charAt(0).toUpperCase() + command.slice(1);
    let icon = 'fa-check-circle';
    
    const frasesConfirmacion = [
      "¡Entendido!",
      "¡Perfecto!",
      "¡De acuerdo!",
      "¡Instrucción recibida!",
      "¡Muy bien!"
    ];
    
    const mensajeConfirmacion = frasesConfirmacion[Math.floor(Math.random() * frasesConfirmacion.length)];
    
    if (command.includes('avanzar')) icon = 'fa-arrow-up';
    else if (command.includes('retroceder')) icon = 'fa-arrow-down';
    else if (command.includes('detener')) icon = 'fa-stop-circle';
    else if (command.includes('vuelta derecha')) icon = 'fa-rotate-right';
    else if (command.includes('vuelta izquierda')) icon = 'fa-rotate-left';
    else if (command.includes('90° derecha')) icon = 'fa-redo-alt';
    else if (command.includes('90° izquierda')) icon = 'fa-undo-alt';
    else if (command.includes('360° derecha')) icon = 'fa-sync-alt';
    else if (command.includes('360° izquierda')) icon = 'fa-sync-alt fa-flip-horizontal';
    
    commandFeedback.innerHTML = `
      <div class="command-executed">
        <div class="d-flex align-items-center">
          <i class="fas ${icon} fa-2x me-3"></i>
          <div>
            <small>${mensajeConfirmacion}</small>
            <div class="command-name">${commandName}</div>
          </div>
        </div>
      </div>
    `;
  } else if (command === "Orden no reconocida") {
    const frasesNoReconocido = [
      "No entendí",
      "No reconocido",
      "No comprendí",
      "No pude entender",
      "No capté bien"
    ];
    
    const frasesIntento = [
      "intenta de nuevo",
      "por favor repite",
      "¿podrías repetirlo?",
      "dilo otra vez",
      "vuelve a intentarlo"
    ];
    
    const fraseNoReconocido = frasesNoReconocido[Math.floor(Math.random() * frasesNoReconocido.length)];
    const fraseIntento = frasesIntento[Math.floor(Math.random() * frasesIntento.length)];
    
    commandFeedback.innerHTML = `
      <div class="command-executed" style="background: linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%);">
        <div class="d-flex align-items-center">
          <i class="fas fa-question-circle fa-2x me-3"></i>
          <div>
            <small>${fraseNoReconocido}:</small>
            <div class="command-name">${fraseIntento}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    const frasesEspera = [
      'Di "Chip" y da una orden',
      'Esperando tu instrucción',
      'Dime qué necesitas',
      'Estoy aquí para ayudarte'
    ];
    
    const fraseEspera = frasesEspera[Math.floor(Math.random() * frasesEspera.length)];
    
    commandFeedback.innerHTML = `
      <div class="command-waiting">
        <i class="fas fa-microphone-slash fa-2x mb-2"></i>
        <p class="mb-0">${fraseEspera}</p>
        <small class="text-muted">Te mostraré aquí el comando reconocido</small>
      </div>
    `;
  }
}

function updateIdleTimerDisplay(seconds) {
  if (idleTimeDisplay) {
    idleTimeDisplay.textContent = seconds;
  }
}

function resetIdleTimer() {
  lastHeardAt = Date.now();
  if (idleTimer) clearInterval(idleTimer);

  idleTimer = setInterval(() => {
    const idleSeconds = Number(idleSecondsInput.value || 6);
    const elapsed = (Date.now() - lastHeardAt) / 1000;
    
    updateIdleTimerDisplay(Math.ceil(elapsed));

    // No suspender si Chip está hablando
    if (!manualStop && !isSuspended && isListening && !isChipSpeaking && elapsed >= idleSeconds) {
      suspendMode("Sin voz por " + idleSeconds + "s → Suspendido");
    }
  }, 250);
}

/* ==========================
   SPEECH SETUP
========================== */
function initRecognizer() {
  if (!SpeechRecognition) {
    setStatus("STOPPED", "SpeechRecognition no disponible en este navegador.");
    setDebug("Usa Chrome/Edge en HTTPS o localhost.");
    return false;
  }

  recognizer = new SpeechRecognition();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = langSelect.value;

  recognizer.onstart = () => {
    isListening = true;
    manualStop = false;

    if (isSuspended) {
      setStatus("SUSPENDED", "Suspendido (di “Chip”)");
      setDebug("Reconociendo solo la palabra de activación.");
    } else {
      setStatus("LISTENING", "Escuchando…");
      setDebug("Listo para órdenes.");
    }

    resetIdleTimer();
  };

  recognizer.onerror = (e) => {
    setDebug(`Error SpeechRecognition: ${e.error}`);
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      setStatus("STOPPED", "Permiso de micrófono denegado.");
    }
  };

  recognizer.onend = () => {
    isListening = false;

    // Si se detuvo porque Chip estaba hablando, no reconectar automáticamente
    if (!manualStop && !isChipSpeaking) {
      setTimeout(() => {
        if (!manualStop && !isChipSpeaking) startRecognizer();
      }, 300);
    }
  };

  recognizer.onresult = async (event) => {
    lastHeardAt = Date.now();
    updateIdleTimerDisplay(0);

    let interim = "";
    let finalText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) finalText += res[0].transcript;
      else interim += res[0].transcript;
    }

    const shown = (finalText || interim).trim();
    if (shown) showTranscript(shown);

    if (!finalText.trim()) return;

    const cleaned = normalizeText(finalText);

    // Si está suspendido, solo se despierta con "Chip"
    if (isSuspended) {
      if (cleaned.includes(WAKE_WORD)) {
        wakeUp();
        speakResponse("despertando");

        const commandText = cleaned.replace(/\bchip\b/g, "").trim();

        if (commandText.length > 0) {
          setDebug("Despertó y procesando orden…");
          const command = await classifyCommandWithAI(commandText);
          showCommand(command);
        } else {
          showCommand("—");
        }
      } else {
        showCommand("—");
      }
      return;
    }

    // Si está despierto: si dice "Chip" solo lo tomamos como palabra de atención
    if (cleaned === WAKE_WORD || cleaned.startsWith(WAKE_WORD + " ")) {
      setDebug("Wake word detectada mientras estaba despierto (ignorada como comando).");
      return;
    }

    setDebug("Enviando a IA para clasificar…");
    const command = await classifyCommandWithAI(finalText);

    showCommand(command);

    setDebug("Listo.");
  };

  return true;
}

function startRecognizer() {
  // No iniciar si Chip está hablando
  if (isChipSpeaking) {
    shouldResumeAfterSpeak = true;
    return;
  }

  if (!recognizer && !initRecognizer()) return;

  recognizer.lang = langSelect.value;

  try {
    recognizer.start();
  } catch (e) {
    // start() puede fallar si ya está iniciado
  }
}

function stopRecognizer(reason = "Detenido") {
  manualStop = true;
  isSuspended = false;
  setStatus("STOPPED", reason);
  setDebug("Reconocimiento detenido.");
  if (idleTimer) clearInterval(idleTimer);
  updateIdleTimerDisplay(0);
  lastProcessedCommand = "";

  if (recognizer) {
    try { recognizer.stop(); } catch {}
  }
}

function suspendMode(reason = "Suspendido") {
  isSuspended = true;
  setStatus("SUSPENDED", reason);
  setDebug("Modo suspendido: di “Chip” para despertar.");
  lastProcessedCommand = "";
}

function wakeUp() {
  isSuspended = false;
  setStatus("LISTENING", "Despierto: escuchando órdenes…");
  setDebug("Despertó por “Chip”.");
  resetIdleTimer();
  lastProcessedCommand = "";
}

/* ==========================
   OPENAI CLASSIFICATION (via backend)
========================== */
async function classifyCommandWithAI(userText) {
  const payload = { text: userText };

  try {
    const resp = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      console.error("Backend HTTP error:", resp.status);
      return "Orden no reconocida";
    }

    const data = await resp.json();
    const cmd = (data.command || "").trim().toLowerCase();

    const allowed = new Set([
      "avanzar",
      "retroceder",
      "detener",
      "vuelta derecha",
      "vuelta izquierda",
      "90° derecha",
      "90° izquierda",
      "360° derecha",
      "360° izquierda"
    ]);

    if (allowed.has(cmd)) return cmd;
    return "Orden no reconocida";
  } catch (err) {
    console.error("Fetch backend failed:", err);
    return "Orden no reconocida";
  }
}

/* ==========================
   EVENTS
========================== */
btnStart.addEventListener("click", () => {
  if (manualStop) manualStop = false;
  if (isSuspended) wakeUp();
  startRecognizer();
});

btnSuspend.addEventListener("click", () => {
  if (!isListening) startRecognizer();
  suspendMode("Suspendido manualmente");
});

btnStop.addEventListener("click", () => stopRecognizer("Detenido manualmente"));

btnClear.addEventListener("click", () => {
  showTranscript("—");
  showCommand("—");
  setDebug("Limpio.");
  lastProcessedCommand = "";
});

langSelect.addEventListener("change", () => {
  if (recognizer) {
    try { recognizer.stop(); } catch {}
    setTimeout(() => startRecognizer(), 200);
  }
});

idleSecondsInput.addEventListener("input", () => {
  updateIdleTimerDisplay(0);
});

/* ==========================
   BIENVENIDA POR VOZ
========================== */
let welcomed = false;

function tryWelcome() {
  if (welcomed) return;
  welcomed = true;
  
  console.log("👆 Usuario interactuó, reproduciendo bienvenida...");
  
  setTimeout(() => {
    speakWelcome();
  }, 300);
}

/* ==========================
   VERIFICAR VOCES DISPONIBLES
========================== */
function checkAvailableVoices() {
  if (!('speechSynthesis' in window)) return;
  
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', () => {
      const voices = speechSynthesis.getVoices();
      console.log("🎤 Voces disponibles:", voices.map(v => `${v.name} (${v.lang})`));
    });
  } else {
    const voices = speechSynthesis.getVoices();
    console.log("🎤 Voces disponibles:", voices.map(v => `${v.name} (${v.lang})`));
  }
}

window.addEventListener('load', checkAvailableVoices);

window.addEventListener("click", function() {
  console.log("Click detectado");
  tryWelcome();
}, { once: true });

window.addEventListener("touchstart", function() {
  console.log("Touch detectado");
  tryWelcome();
}, { once: true });

btnStart.addEventListener("click", function() {
  console.log("Click en botón Start");
  tryWelcome();
}, { once: true });

/* ==========================
   AUTO START ON LOAD
========================== */
window.addEventListener("load", () => {
  setStatus("LISTENING", "Iniciando…");
  setDebug("Solicitando micrófono… Haz click para escuchar la bienvenida");
  
  updateIdleTimerDisplay(0);

  startRecognizer();
});