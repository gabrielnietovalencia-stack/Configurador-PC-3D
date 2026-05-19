import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f11); // Un pelín más azulado/oscuro futurista

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// Habilitamos mapas de tonos para que los colores brillen más reales
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// MEJORA DE LUCES: Luz ambiental + 2 focos para destacar el metal
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
light1.position.set(5, 10, 7);
scene.add(light1);

const light2 = new THREE.DirectionalLight(0x00ffff, 0.5); // Un toque de luz azul de fondo
light2.position.set(-5, 5, -5);
scene.add(light2);

const loader = new GLTFLoader();

let piezasActivas = {
    caja: null,
    placa: null,
    grafica: null
};

// Ahora la función recibe el nombre bonito del componente para escribirlo en el menú
window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito) {
    if (piezasActivas[tipo]) {
        scene.remove(piezasActivas[tipo]);
    }

    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;
        
        // Mantenemos tus reglas de tamaño actuales
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

        // NUEVO: Modifica el texto del HTML dinámicamente
        const elementoTexto = document.getElementById(`txt-${tipo}`);
        if (elementoTexto) {
            elementoTexto.innerHTML = `${tipo.toUpperCase()}: ${nombreBonito}`;
        }

    }, undefined, (error) => console.error(error));
};

// Carga inicial por defecto
cambiarComponente('caja', 'case_corsair.glb', 'Corsair iCUE');
cambiarComponente('placa', 'mobo_pro.glb', 'ASUS Pro WS');
cambiarComponente('grafica', 'gpu_4090.glb', 'RTX 4090 ROG');

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
