import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 5, 5);
scene.add(sunLight);

const loader = new GLTFLoader();

// Diccionario para guardar las piezas activas y poder cambiarlas luego
let piezasActivas = {
    caja: null,
    placa: null,
    grafica: null
};

// Función mejorada para cargar
window.cambiarComponente = function(tipo, nombreArchivo, x = 0, y = 0, z = 0, escala = 1) {
    // Si ya hay una pieza de ese tipo puesta, la borramos de la escena
    if (piezasActivas[tipo]) {
        scene.remove(piezasActivas[tipo]);
    }

    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;
        model.position.set(x, y, z);
        model.scale.set(escala, escala, escala);
        
        scene.add(model);
        piezasActivas[tipo] = model; // Guardamos la nueva pieza
        console.log(`Montado: ${tipo} -> ${nombreArchivo}`);
    }, undefined, (error) => console.error(error));
};

// --- MONTAJE INICIAL DE PRUEBA ---
// Tipo de pieza, Nombre de archivo, X, Y, Z, Escala
cambiarComponente('caja', 'case_corsair.glb', 0, 0, 0, 1);
cambiarComponente('placa', 'mobo_pro.glb', 0, 0.5, -0.3, 0.012); 
cambiarComponente('grafica', 'gpu_4090.glb', 0, 0.3, 0.1, 0.01); // Tu nueva gráfica

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
