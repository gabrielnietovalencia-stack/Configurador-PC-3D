import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'; // <-- Importación corregida y segura

// ========================================================
// 1. GESTOR DE CARGA
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

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

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
// 4. EL PANEL MÁGICO DE CALIBRACIÓN (SIN LÍMITES)
// ========================================================
let piezasActivas = { caja: null, placa: null, grafica: null };
let preciosActivos = { caja: 0, placa: 0, grafica: 0 };

const gui = new GUI({ title: '🛠️ Calibrador 3D (Extremo)' });

// Valores iniciales 
const params = {
    caja_Scale: 1, caja_X: 0, caja_Y: 0, caja_Z: 0, caja_RotX: 0, caja_RotY: 0, caja_RotZ: 0,
    placa_Scale: 1, placa_X: 0, placa_Y: 0, placa_Z: 0, placa_RotX: 0, placa_RotY: 0, placa_RotZ: 0,
    grafica_Scale: 1, grafica_X: 0, grafica_Y: 0, grafica_Z: 0, grafica_RotX: 0, grafica_RotY: 0, grafica_RotZ: 0,
    autoRotar: false
};

// --- CAJA ---
const folderCaja = gui.addFolder('📦 CAJA');
folderCaja.add(params, 'caja_Scale', 0.0001, 500, 0.01).name('Escala').onChange(v => { if(piezasActivas.caja) piezasActivas.caja.scale.set(v,v,v) });
folderCaja.add(params, 'caja_X', -100, 100, 0.1).name('Mover X').onChange(v => { if(piezasActivas.caja) piezasActivas.caja.position.x = v });
folderCaja.add(params, 'caja_Y', -100, 100, 0.1).name('Mover Y').onChange(v => { if(piezasActivas.caja) piezasActivas.caja.position.y = v });
folderCaja.add(params, 'caja_Z', -100, 100, 0.1).name('Mover Z').onChange(v => { if(piezasActivas.caja) piezasActivas.caja.position.z = v });
folderCaja.add(params, 'caja_RotX', -6.28, 6.28, 0.01).name('Rotar X').onChange(v => { if(piezasActivas.caja) piezasActivas.caja.rotation.x = v });
folderCaja.add(params, 'caja_RotY', -6.28, 6.28, 0.01).name('Rotar Y').onChange(v => { if(piezasActivas.caja) piezasActivas.caja.rotation.y = v });
folderCaja.add(params, 'caja_RotZ', -6.28, 6.28, 0.01).name('Rotar Z').onChange(v => { if(piezasActivas.caja) piezasActivas.caja.rotation.z = v });

// --- PLACA ---
const folderPlaca = gui.addFolder('🎛️ PLACA BASE');
folderPlaca.add(params, 'placa_Scale', 0.0001, 500, 0.01).name('Escala').onChange(v => { if(piezasActivas.placa) piezasActivas.placa.scale.set(v,v,v) });
folderPlaca.add(params, 'placa_X', -100, 100, 0.1).name('Mover X').onChange(v => { if(piezasActivas.placa) piezasActivas.placa.position.x = v });
folderPlaca.add(params, 'placa_Y', -100, 100, 0.1).name('Mover Y').onChange(v => { if(piezasActivas.placa) piezasActivas.placa.position.y = v });
folderPlaca.add(params, 'placa_Z', -100, 100, 0.1).name('Mover Z').onChange(v => { if(piezasActivas.placa) piezasActivas.placa.position.z = v });
folderPlaca.add(params, 'placa_RotX', -6.28, 6.28, 0.01).name('Rotar X').onChange(v => { if(piezasActivas.placa) piezasActivas.placa.rotation.x = v });
folderPlaca.add(params, 'placa_RotY', -6.28, 6.28, 0.01).name('Rotar Y').onChange(v => { if(piezasActivas.placa) piezasActivas.placa.rotation.y = v });
folderPlaca.add(params, 'placa_RotZ', -6.28, 6.28, 0.01).name('Rotar Z').onChange(v => { if(piezasActivas.placa) piezasActivas.placa.rotation.z = v });

// --- GRÁFICA ---
const folderGrafica = gui.addFolder('🎮 GRÁFICA');
folderGrafica.add(params, 'grafica_Scale', 0.0001, 500, 0.01).name('Escala').onChange(v => { if(piezasActivas.grafica) piezasActivas.grafica.scale.set(v,v,v) });
folderGrafica.add(params, 'grafica_X', -100, 100, 0.1).name('Mover X').onChange(v => { if(piezasActivas.grafica) piezasActivas.grafica.position.x = v });
folderGrafica.add(params, 'grafica_Y', -100, 100, 0.1).name('Mover Y').onChange(v => { if(piezasActivas.grafica) piezasActivas.grafica.position.y = v });
folderGrafica.add(params, 'grafica_Z', -100, 100, 0.1).name('Mover Z').onChange(v => { if(piezasActivas.grafica) piezasActivas.grafica.position.z = v });
folderGrafica.add(params, 'grafica_RotX', -6.28, 6.28, 0.01).name('Rotar X').onChange(v => { if(piezasActivas.grafica) piezasActivas.grafica.rotation.x = v });
folderGrafica.add(params, 'grafica_RotY', -6.28, 6.28, 0.01).name('Rotar Y').onChange(v => { if(piezasActivas.grafica) piezasActivas.grafica.rotation.y = v });
folderGrafica.add(params, 'grafica_RotZ', -6.28, 6.28, 0.01).name('Rotar Z').onChange(v => { if(piezasActivas.grafica) piezasActivas.grafica.rotation.z = v });

// --- UTILIDADES ---
gui.add(params, 'autoRotar').name('🔄 Auto-Rotación');

// ========================================================
// 5. LÓGICA DE COMPONENTES
// ========================================================
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
        
        // Asignamos la posición del panel directamente para no perderla
        if (tipo === 'caja') {
            model.position.set(params.caja_X, params.caja_Y, params.caja_Z);
            model.rotation.set(params.caja_RotX, params.caja_RotY, params.caja_RotZ);
            model.scale.set(params.caja_Scale, params.caja_Scale, params.caja_Scale);
        } else if (tipo === 'placa') {
            model.position.set(params.placa_X, params.placa_Y, params.placa_Z);
            model.rotation.set(params.placa_RotX, params.placa_RotY, params.placa_RotZ);
            model.scale.set(params.placa_Scale, params.placa_Scale, params.placa_Scale);
        } else if (tipo === 'grafica') {
            model.position.set(params.grafica_X, params.grafica_Y, params.grafica_Z);
            model.rotation.set(params.grafica_RotX, params.grafica_RotY, params.grafica_RotZ);
            model.scale.set(params.grafica_Scale, params.grafica_Scale, params.grafica_Scale);
        }

        scene.add(model);
        piezasActivas[tipo] = model;

        const elTexto = document.getElementById(`txt-${tipo}`);
        if (elTexto) elTexto.innerHTML = `<strong>${tipo.toUpperCase()}:</strong> ${nombreBonito} (${precio}€)`;

    }, undefined, (error) => console.error(error));
};

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
    
    controls.autoRotate = params.autoRotar;
    controls.autoRotateSpeed = 1.5;
    controls.update(); 
    
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
