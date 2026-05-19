import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ========================================================
// 1. GESTOR DE CARGA (Con límite de 3 segundos)
// ========================================================
setTimeout(() => {
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla && pantalla.style.display !== 'none') {
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

// ========================================================
// 2. CONFIGURACIÓN DE LA ESCENA Y CÁMARA
// ========================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111116);

// Cámara alejada para ver las piezas completas
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
// Auto-rotación activada
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;

// ========================================================
// 3. ILUMINACIÓN Y CUADRÍCULA
// ========================================================
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 8, 5);
scene.add(light);

const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// ========================================================
// 4. LÓGICA DE COMPONENTES
// ========================================================
let piezasActivas = { caja: null, placa: null, grafica: null };
let preciosActivos = { caja: 0, placa: 0, grafica: 0 };
const loader = new GLTFLoader(loadingManager);

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
        
        // --- TAMAÑOS, POSICIONES Y ROTACIONES CORREGIDAS ---
        if (tipo === 'caja') {
            model.position.set(0, 0, 0);
            model.rotation.set(0, 0, 0);
            model.scale.set(0.01, 0.01, 0.01); // Caja reducida 100 veces
            
        } else if (tipo === 'placa') {
            model.position.set(0, 0.5, -0.3);
            model.rotation.set(0, 0, 0);
            model.scale.set(0.005, 0.005, 0.005); // Placa adaptada
            
        } else if (tipo === 'grafica') {
            model.position.set(0, 0.3, 0.1);
            model.rotation.set(Math.PI / 2, 0, 0); // Gráfica tumbada 90 grados
            model.scale.set(0.002, 0.002, 0.002); // Gráfica reducida al máximo
        }
        // ----------------------------------------------------

        scene.add(model);
        piezasActivas[tipo] = model;

        const elTexto = document.getElementById(`txt-${tipo}`);
        if (elTexto) elTexto.innerHTML = `<strong>${tipo.toUpperCase()}:</strong> ${nombreBonito} (${precio}€)`;

    }, undefined, (error) => console.error(error));
};

// ========================================================
// 5. FUNCIÓN VACIAR PC
// ========================================================
window.reiniciarPC = function() {
    ['caja', 'placa', 'grafica'].forEach(tipo => {
        if (piezasActivas[tipo]) {
            scene.remove(piezasActivas[tipo]);
            piezasActivas[tipo] = null;
        }
        preciosActivos[tipo] = 0;
        const elTexto = document.getElementById(`txt-${tipo}`);
        if (elTexto) elTexto.innerHTML = `<span style="color: #555;"><strong>${tipo.toUpperCase()}:</strong> -</span>`;
    });
    actualizarPrecioTotal();
};

// Carga Inicial
cambiarComponente('caja', 'case_corsair.glb', 'Corsair iCUE', 150);
cambiarComponente('placa', 'mobo_pro.glb', 'ASUS Pro WS', 350);
cambiarComponente('grafica', 'gpu_4090.glb', 'RTX 40 ROG', 2000);

// ========================================================
// 6. BUCLE DE ANIMACIÓN
// ========================================================
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Hace que la rotación automática funcione
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
