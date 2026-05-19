import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ========================================================
// 1. GESTOR DE CARGA Y BOTÓN DE PÁNICO (3 SEGUNDOS)
// ========================================================
setTimeout(() => {
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla && pantalla.style.display !== 'none') {
        console.warn("Tiempo límite alcanzado. Forzando apertura de la web...");
        pantalla.style.opacity = '0';
        setTimeout(() => { pantalla.style.display = 'none'; }, 500);
    }
}, 3000); 

const loadingManager = new THREE.LoadingManager();

loadingManager.onLoad = function () {
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla) {
        pantalla.style.opacity = '0';
        setTimeout(() => { pantalla.style.display = 'none'; }, 500);
    }
};

loadingManager.onError = function (url) {
    console.error('Error cargando el archivo: ' + url);
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla) { pantalla.style.display = 'none'; }
};

// ========================================================
// 2. CONFIGURACIÓN DE LA ESCENA ESCENARIO 3D
// ========================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111116);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Iluminación
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 8, 5);
scene.add(light);

// NUEVO: CUADRÍCULA HOLOGRÁFICA EN EL SUELO
const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5; // Ajustada un pelo abajo como suelo
scene.add(gridHelper);

const loader = new GLTFLoader(loadingManager);

// ========================================================
// 3. LOGICA DE COMPONENTES Y CALCULADORA DE PRECIOS
// ========================================================
let piezasActivas = { caja: null, placa: null, grafica: null };
let preciosActivos = { caja: 0, placa: 0, grafica: 0 };

function actualizarPrecioTotal() {
    const total = preciosActivos.caja + preciosActivos.placa + preciosActivos.grafica;
    const elTotal = document.getElementById('precio-total');
    if (elTotal) elTotal.innerText = total;
}

window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito, precio) {
    if (piezasActivas[tipo]) {
        scene.remove(piezasActivas[tipo]);
    }

    preciosActivos[tipo] = precio;
    actualizarPrecioTotal();

    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;
        
     // --- SECCIÓN DE CALIBRACIÓN MANUAL ---
        if (tipo === 'caja') {
            // Le devolvemos un tamaño decente para que se vea
            model.position.set(0, -0.5, 0); 
            model.scale.set(1, 1, 1); 

        } else if (tipo === 'placa') {
            // Era un puntito microscópico, ¡vamos a multiplicarla por 20!
            model.position.set(0, 0.5, -0.5);
            model.scale.set(1, 5, 1); 

        } else if (tipo === 'grafica') {
            // Es un monstruo gigante, ¡vamos a encogerla muchísimo más! (Fíjate en los ceros)
            model.position.set(0, 0.5, 0);
            model.scale.set(1, 1.5, 1); 
        }
        // -----------------------------------------------------------------
        scene.add(model);
        piezasActivas[tipo] = model;

        const elTexto = document.getElementById(`txt-${tipo}`);
        if (elTexto) {
            elTexto.innerHTML = `<strong>${tipo.toUpperCase()}:</strong> ${nombreBonito} (${precio}€)`;
        }

    }, undefined, (error) => console.error(error));
};

// Carga de componentes iniciales por defecto con sus precios
cambiarComponente('caja', 'case_corsair.glb', 'Corsair iCUE', 150);
cambiarComponente('placa', 'mobo_pro.glb', 'ASUS Pro WS', 350);
cambiarComponente('grafica', 'gpu_4090.glb', 'RTX 40 ROG', 2000);

// ========================================================
// 4. BUCLE DE RENDERIZADO ANIMACIÓN
// ========================================================
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
