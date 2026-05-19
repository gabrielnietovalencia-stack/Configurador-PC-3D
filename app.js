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

let piezasActivas = {
    caja: null,
    placa: null,
    grafica: null
};

// Esta función ignora los números del HTML y aplica las escalas correctas aquí abajo
window.cambiarComponente = function(tipo, nombreArchivo) {
    if (piezasActivas[tipo]) {
        scene.remove(piezasActivas[tipo]);
    }

    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;
        
        // ========================================================
        // REGLAS DE TAMAÑO PERSONALIZADAS (Ajusta estos números)
        // ========================================================
        if (tipo === 'caja') {
            model.position.set(0, 0, 0);
            model.scale.set(1, 1, 1); // Si la caja es gigante, puedes probar con 0.5 o 0.2
            
        } else if (tipo === 'placa') {
            // Si antes era diminuta con 0.012, vamos a subirla a 0.15 para que sea más grande
            model.position.set(0, 0.5, -0.3);
            model.scale.set(0.15, 0.15, 0.15); 
            
        } else if (tipo === 'grafica') {
            // La gráfica se veía bien en 0.01, la dejamos ahí
            model.position.set(0, 0.3, 0.1);
            model.scale.set(0.01, 0.01, 0.01);
        }
        // ========================================================

        scene.add(model);
        piezasActivas[tipo] = model;
        console.log(`Montado correctamente: ${nombreArchivo}`);
    }, undefined, (error) => console.error("Error cargando pieza:", error));
};

// Carga inicial automática al entrar a la web
cambiarComponente('caja', 'case_corsair.glb');
cambiarComponente('placa', 'mobo_pro.glb');
cambiarComponente('grafica', 'gpu_4090.glb');

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
