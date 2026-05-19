import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. GESTOR DE CARGA (El interruptor de la pantalla)
const loadingManager = new THREE.LoadingManager();

// Función que se activa cuando TODO se ha cargado con éxito
loadingManager.onLoad = function () {
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla) {
        pantalla.style.opacity = '0'; // Desvanecer
        setTimeout(() => {
            pantalla.style.display = 'none'; // Ocultar del todo
        }, 500);
    }
};

// Sistema de emergencia: Si un archivo falla, quitamos la pantalla igual para ver el error
loadingManager.onError = function (url) {
    console.error('Error cargando: ' + url);
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla) {
        pantalla.style.display = 'none';
    }
};

// 2. CONFIGURACIÓN DE LA ESCENA 3D
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111116);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 8, 5);
scene.add(light);

// Pasamos el loadingManager al cargador de archivos
const loader = new GLTFLoader(loadingManager);

// 3. LÓGICA DEL CONFIGURADOR Y PRECIOS
let piezasActivas = { caja: null, placa: null, grafica: null };
let preciosActivos = { caja: 0, placa: 0, grafica: 0 };

function actualizarPrecioTotal() {
    const total = preciosActivos.caja + preciosActivos.placa + preciosActivos.grafica;
    document.getElementById('precio-total').innerText = total;
}

window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito, precio) {
    if (piezasActivas[tipo]) {
        scene.remove(piezasActivas[tipo]);
    }

    preciosActivos[tipo] = precio;
    actualizarPrecioTotal();

    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;
        
        // Reglas de escala provisionales
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

        scene.add(model);
        piezasActivas[tipo] = model;

        // Actualizar textos del menú flotante
        document.getElementById(`txt-${tipo}`).innerHTML = `<strong>${tipo.toUpperCase()}:</strong> ${nombreBonito} (${precio}€)`;

    }, undefined, (error) => console.error(error));
};

// 4. CARGA INICIAL (Lo que se descarga mientras gira el círculo)
cambiarComponente('caja', 'case_corsair.glb', 'Corsair iCUE', 150);
cambiarComponente('placa', 'mobo_pro.glb', 'ASUS Pro WS', 350);
cambiarComponente('grafica', 'gpu_4090.glb', 'RTX 40 ROG', 2000);

// 5. BUCLE DE ANIMACIÓN
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
