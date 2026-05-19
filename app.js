import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ========================================================
// GESTOR DE CARGA Y BOTÓN DE PÁNICO (3 SEGUNDOS)
// ========================================================
setTimeout(() => {
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla && pantalla.style.display !== 'none') {
        console.warn("Tiempo límite. Forzando apertura...");
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
    console.error('Error cargando: ' + url);
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla) { pantalla.style.display = 'none'; }
};

// ========================================================
// CONFIGURACIÓN DE LA ESCENA
// ========================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111116);

// Cámara en su posición original
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// 👇 AQUÍ ESTÁ LA MAGIA DE LA AUTO-ROTACIÓN
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;

// Iluminación
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 8, 5);
scene.add(light);

// Cuadrícula Holográfica
const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

const loader = new GLTFLoader(loadingManager);

// ========================================================
// LOGICA DE COMPONENTES Y PRECIOS
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
        
        // --- VALORES DE TAMAÑO RESTAURADOS ---
        if (tipo === 'caja') {
            model.position.set(0, 0, 0);
            model.scale.set(1, 1, 1);
        } else if (tipo === 'placa') {
            model.position.set(0, 0.5, -0.3);
            model.scale.set(0.15, 0.15, 0.15); 
        } else if (tipo === 'grafica') {
            model.position.set(0, 0.3, 0.1);
            model.scale.set(0.01, 0.01, 0.01);
        }
        // -------------------------------------

        scene.add(model);
        piezasActivas[tipo] = model;

        const elTexto = document.getElementById(`txt-${tipo}`);
        if (elTexto) {
            elTexto.innerHTML = `<strong>${tipo.toUpperCase()}:</strong> ${nombreBonito} (${precio}€)`;
        }

    }, undefined, (error) => console.error(error));
};

// ========================================================
// FUNCIÓN PARA VACIAR EL PC
// ========================================================
window.reiniciarPC = function() {
    ['caja', 'placa', 'grafica'].forEach(tipo => {
        if (piezasActivas[tipo]) {
            scene.remove(piezasActivas[tipo]);
            piezasActivas[tipo] = null;
        }
        preciosActivos[tipo] = 0;
        const elTexto = document.getElementById(`txt-${tipo}`);
        if (elTexto) {
            elTexto.innerHTML = `<span style="color: #555;"><strong>${tipo.toUpperCase()}:</strong> -</span>`;
        }
    });
    actualizarPrecioTotal();
};

// ========================================================
// CARGA INICIAL POR DEFECTO
// ========================================================
cambiarComponente('caja', 'case_corsair.glb', 'Corsair iCUE', 150);
cambiarComponente('placa', 'mobo_pro.glb', 'ASUS Pro WS', 350);
cambiarComponente('grafica', 'gpu_4090.glb', 'RTX 40 ROG', 2000);

// ========================================================
// BUCLE DE ANIMACIÓN
// ========================================================
function animate() {
    requestAnimationFrame(animate);
    
    // 👇 ESTO ES EL MOTOR QUE HACE QUE GIRE
    controls.update(); 
    
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
