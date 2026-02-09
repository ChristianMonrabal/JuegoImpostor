/* ===============================
   ESTADO GLOBAL
================================ */
let config = {
    cantidad: 3,
    usarPista: true,
    diccionario: [],
    jugadores: [],
    palabraActual: null,
    indiceActual: 0,
    ordenJuego: []
};

/* ===============================
   VISTAS
================================ */
const vistas = {
    portada: document.getElementById("vista-portada"),
    nombres: document.getElementById("vista-nombres"),
    cartas: document.getElementById("vista-cartas"),
    final: document.getElementById("vista-final")
};

function cambiarVista(nombreVista) {
    Object.values(vistas).forEach(v => v.classList.remove("activa"));
    vistas[nombreVista].classList.add("activa");
}

/* ===============================
   CARGAR DICCIONARIO
================================ */
async function cargarDiccionario() {
    try {
        const response = await fetch("data/diccionario.json");
        const data = await response.json();
        config.diccionario = data.palabras;
        console.log("📚 Diccionario: " + config.diccionario.length + " palabras");
    } catch (error) {
        console.error("❌ Error:", error);
        config.diccionario = [
            { palabra: "Plátano", pista: "Fruta tropical" },
            { palabra: "Playa", pista: "Arena y mar" },
            { palabra: "Ordenador", pista: "Máquina electrónica" }
        ];
    }
}

cargarDiccionario();

/* ===============================
   GUARDAR Y CARGAR NOMBRES
================================ */
function guardarNombres() {
    const nombres = config.jugadores.map(j => j.nombre);
    localStorage.setItem("jugadoresGuardados", JSON.stringify(nombres));
}

function cargarNombresGuardados() {
    const nombresGuardados = localStorage.getItem("jugadoresGuardados");
    return nombresGuardados ? JSON.parse(nombresGuardados) : null;
}

/* ===============================
   PORTADA
================================ */
const cantidadDisplay = document.getElementById("cantidad");
const checkboxPista = document.getElementById("usarPista");

document.getElementById("mas").addEventListener("click", () => {
    if (config.cantidad < 20) {
        config.cantidad++;
        cantidadDisplay.textContent = config.cantidad;
    }
});

document.getElementById("menos").addEventListener("click", () => {
    if (config.cantidad > 3) {
        config.cantidad--;
        cantidadDisplay.textContent = config.cantidad;
    }
});

document.getElementById("btnEmpezar").addEventListener("click", () => {
    const lista = document.getElementById("lista-nombres");
    lista.innerHTML = "";
    
    // Cargar nombres guardados si existen
    const nombresGuardados = cargarNombresGuardados();
    
    for (let i = 0; i < config.cantidad; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = `Jugador ${i + 1}`;
        input.className = "input-nombre";
        
        // Si hay nombres guardados y coincide el índice, cargarlos
        if (nombresGuardados && i < nombresGuardados.length) {
            input.value = nombresGuardados[i];
        }
        
        lista.appendChild(input);
    }
    
    cambiarVista("nombres");
});

/* ===============================
   VISTA NOMBRES
================================ */
document.getElementById("btnContinuar").addEventListener("click", () => {
    const inputs = document.querySelectorAll(".input-nombre");
    
    config.usarPista = checkboxPista.checked;
    config.jugadores = Array.from(inputs).map((inp, idx) => ({
        nombre: inp.value.trim() || `Jugador ${idx + 1}`,
        rol: "civil"
    }));
    
    // Guardar nombres para próxima partida
    guardarNombres();
    
    iniciarJuego();
    cambiarVista("cartas");
    mostrarCarta();
});

/* ===============================
   LÓGICA DEL JUEGO
================================ */
function generarOrdenJuego() {
    // Crear lista de índices civiles e impostores separados
    const civiles = [];
    const impostores = [];
    
    config.jugadores.forEach((j, idx) => {
        if (j.rol === "impostor") {
            impostores.push(idx);
        } else {
            civiles.push(idx);
        }
    });
    
    // Mezclar cada lista
    civiles.sort(() => Math.random() - 0.5);
    impostores.sort(() => Math.random() - 0.5);
    
    // Construir orden: civiles primero (70% de probabilidad), luego impostores
    config.ordenJuego = Math.random() < 0.7 ? [...civiles, ...impostores] : [...impostores, ...civiles];
}

function iniciarJuego() {
    // Elegir palabra aleatoria
    const idx = Math.floor(Math.random() * config.diccionario.length);
    config.palabraActual = config.diccionario[idx];
    
    // Determinar número de impostores
    let numImpostores = 1;
    if (config.cantidad >= 4) {
        numImpostores = Math.random() < 0.5 ? 1 : 2;
    }
    
    // Elegir impostores aleatorios sin duplicados
    const indicesImpostores = [];
    while (indicesImpostores.length < numImpostores) {
        const idxImpostor = Math.floor(Math.random() * config.jugadores.length);
        if (!indicesImpostores.includes(idxImpostor)) {
            indicesImpostores.push(idxImpostor);
            config.jugadores[idxImpostor].rol = "impostor";
        }
    }
    
    // Generar orden de juego
    generarOrdenJuego();
    config.indiceActual = 0;
}

/* ===============================
   VISTA CARTAS - ESTRUCTURA
================================ */
const cartaElemento = document.getElementById("carta");
const cartaFrente = document.querySelector(".carta-frente");
const cartaDorso = document.getElementById("cartaDorso");
const turnoText = document.getElementById("turnoJugador");
const contadorText = document.getElementById("contadorCartas");
const btnSiguiente = document.getElementById("btnSiguienteCarta");

function mostrarCarta() {
    const indiceJugador = config.ordenJuego[config.indiceActual];
    const jugador = config.jugadores[indiceJugador];
    
    // Reset variables y estilos
    cartaRevelada = false;
    currentY = 0;
    cartaElemento.style.transform = "translateY(0)";
    
    // Reset carta al frente
    cartaFrente.classList.remove("hidden");
    cartaDorso.classList.remove("visible");
    
    // Actualizar nombre
    turnoText.textContent = jugador.nombre;
    
    // Actualizar contador
    contadorText.textContent = `${config.indiceActual + 1} / ${config.jugadores.length}`;
    
    // Llenar dorso con contenido
    cartaDorso.innerHTML = "";
    
    if (jugador.rol === "impostor") {
        const titulo = document.createElement("div");
        titulo.style.fontSize = "2.5em";
        titulo.style.fontWeight = "bold";
        titulo.style.marginBottom = "20px";
        titulo.textContent = "🎭 IMPOSTOR";
        cartaDorso.appendChild(titulo);
        
        if (config.usarPista && config.palabraActual.pista) {
            const pista = document.createElement("div");
            pista.style.fontSize = "1em";
            pista.style.marginTop = "15px";
            pista.innerHTML = `<strong>Pista:</strong> ${config.palabraActual.pista}`;
            cartaDorso.appendChild(pista);
        }
    } else {
        const palabra = document.createElement("div");
        palabra.style.fontSize = "2.5em";
        palabra.style.fontWeight = "bold";
        palabra.textContent = config.palabraActual.palabra;
        cartaDorso.appendChild(palabra);
    }
}

/* ===============================
   MANEJO DE EVENTOS TOUCH/MOUSE
================================ */
let touchStart = 0;
let touchX = 0;
let currentY = 0;
let isDragging = false;

function revelarCarta() {
    cartaFrente.classList.add("hidden");
    cartaDorso.classList.add("visible");
}

cartaElemento.addEventListener("touchstart", (e) => {
    isDragging = true;
    touchStart = e.touches[0].clientY;
    touchX = e.touches[0].clientX;
    cartaElemento.classList.add("grabbing");
}, { passive: false });

cartaElemento.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    
    const moveY = e.touches[0].clientY;
    const moveX = e.touches[0].clientX;
    const diffY = touchStart - moveY;
    const diffX = Math.abs(touchX - moveX);
    
    // Solo mover si es más vertical que horizontal
    if (diffY > diffX && diffY > 0) {
        e.preventDefault();
        currentY = Math.min(Math.max(diffY, 0), 150);
        cartaElemento.style.transform = `translateY(-${currentY}px)`;
        
        // Mostrar cuando llega a cierto punto
        if (currentY > 100) {
            revelarCarta();
        }
    }
}, { passive: false });

cartaElemento.addEventListener("touchend", () => {
    isDragging = false;
    cartaElemento.classList.remove("grabbing");
    
    // Agregar transición suave para el snap
    cartaElemento.style.transition = "transform 0.3s ease-out";
    
    if (currentY > 100) {
        // Si pasó el threshold, subir completamente
        cartaElemento.style.transform = `translateY(-350px)`;
    } else {
        // Si no pasó el threshold, volver a la posición inicial
        cartaElemento.style.transform = "translateY(0)";
        cartaFrente.classList.remove("hidden");
        cartaDorso.classList.remove("visible");
        cartaRevelada = false;
    }
    
    currentY = 0;
    
    // Remover transición después para que el drag sea fluido nuevamente
    setTimeout(() => {
        cartaElemento.style.transition = "none";
    }, 300);
});

// Soporte para mouse (desarrollo)
let isMouseDown = false;
cartaElemento.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    isDragging = true;
    touchStart = e.clientY;
    touchX = e.clientX;
    cartaElemento.classList.add("grabbing");
});

document.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;
    
    const diffY = touchStart - e.clientY;
    const diffX = Math.abs(touchX - e.clientX);
    
    if (diffY > diffX && diffY > 0) {
        currentY = Math.min(Math.max(diffY, 0), 150);
        cartaElemento.style.transform = `translateY(-${currentY}px)`;
        
        if (currentY > 100) {
            revelarCarta();
        }
    }
});

document.addEventListener("mouseup", () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    isDragging = false;
    cartaElemento.classList.remove("grabbing");
    
    // Agregar transición suave para el snap
    cartaElemento.style.transition = "transform 0.3s ease-out";
    
    if (currentY > 100) {
        // Si pasó el threshold, subir completamente
        cartaElemento.style.transform = `translateY(-350px)`;
    } else {
        // Si no pasó el threshold, volver a la posición inicial
        cartaElemento.style.transform = "translateY(0)";
        cartaFrente.classList.remove("hidden");
        cartaDorso.classList.remove("visible");
        cartaRevelada = false;
    }
    
    currentY = 0;
    
    // Remover transición después para que el drag sea fluido nuevamente
    setTimeout(() => {
        cartaElemento.style.transition = "none";
    }, 300);
});

/* ===============================
   SIGUIENTE CARTA
================================ */
btnSiguiente.addEventListener("click", () => {
    config.indiceActual++;
    
    if (config.indiceActual < config.jugadores.length) {
        mostrarCarta();
    } else {
        mostrarResumen();
        cambiarVista("final");
    }
});

/* ===============================
   RESUMEN FINAL
================================ */
function mostrarResumen() {
    const listaFinal = document.getElementById("lista-final");
    if (listaFinal) {
        listaFinal.innerHTML = "";
        
        // Mostrar nombres en orden de juego
        config.ordenJuego.forEach((idx, posicion) => {
            const j = config.jugadores[idx];
            const div = document.createElement("div");
            div.style.padding = "10px";
            div.style.background = "#1e293b";
            div.style.borderRadius = "10px";
            div.style.marginBottom = "10px";
            div.style.fontSize = "1.1em";
            div.textContent = `${posicion + 1}. ${j.nombre}`;
            listaFinal.appendChild(div);
        });
    }
}