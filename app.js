import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. CONFIGURACIÓN BÁSICA (ESCENA, CÁMARA Y RENDER)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a); // Gris casi negro muy pro

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5); // Cámara un poco alejada para ver todo

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. CONTROLES (Para que puedas rotar con el ratón)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 3. ILUMINACIÓN (Sin esto los modelos se ven negros)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Luz general
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 2); // Luz de foco
spotLight.position.set(5, 10, 5);
scene.add(spotLight);

// 4. CARGADOR DE MODELOS GLB
const loader = new GLTFLoader();

window.cargarModelo = function(nombreArchivo) {
    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        console.log("Cargado: " + nombreArchivo);
    }, undefined, (error) => {
        console.error("Error al cargar el modelo 3D:", error);
    });
};

// 5. BUCLE DE RENDERIZADO (Animación)
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Ajuste si cambias el tamaño de la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
