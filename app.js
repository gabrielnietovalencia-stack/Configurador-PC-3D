import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Escena y Cámara
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // Fondo casi negro

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Controles y Luces
const controls = new OrbitControls(camera, renderer.domElement);
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 5, 5);
scene.add(sunLight);

// 3. Cargador de Modelos
const loader = new GLTFLoader();

function cargarPieza(nombreArchivo, x = 0, y = 0, z = 0, escala = 1) {
    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;
        model.position.set(x, y, z);
        model.scale.set(escala, escala, escala);
        scene.add(model);
        console.log("Cargado con éxito: " + nombreArchivo);
    }, undefined, (error) => {
        console.error("Error al cargar " + nombreArchivo, error);
    });
}

// 4. Montaje de prueba inicial
// Vamos a cargar la caja Corsair y la placa base Pro
cargarPieza('case_corsair.glb', 0, 0, 0, 1);
cargarPieza('mobo_pro.glb', 0, 0.2, -0.4, 0.002); // La placa suele ir más pequeña y atrás

// 5. Animación
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Ajustar ventana si cambias el tamaño del navegador
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
