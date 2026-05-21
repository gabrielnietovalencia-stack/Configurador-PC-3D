// ==========================================
// 1. CONFIGURACIÓN DEL MUNDO 3D (Escena, Cámara y Render)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Fondo oscuro futurista

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 8); // Posición inicial de la cámara

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Activar sombras
document.body.appendChild(renderer.domElement);

// Rejilla del suelo (Grid)
const gridHelper = new THREE.GridHelper(20, 20, 0x00ffcc, 0x444444);
scene.add(gridHelper);

// Controles para mover la cámara con el ratón (Girar y hacer zoom)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ==========================================
// 2. ILUMINACIÓN POTENTE (Para evitar el color negro)
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Luz global
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.0); // Luz directa tipo sol
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// ==========================================
// 3. CARGADOR DE MODELOS 3D (GLTFLoader)
// ==========================================
const loader = new THREE.GLTFLoader();

// 👇 ¡CAMBIA ESTA RUTA por la caja que quieras probar primero! 
// Puede ser: 'models/nzxt_h9.gltf', 'models/corsair.gltf' o 'models/fractal.gltf'
const modeloCaja = 'models/nzxt_h9.gltf'; 

loader.load(modeloCaja, function (gltf) {
    const model = gltf.scene;

    // A. Reparar materiales oscuros
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.roughness = 0.5; 
                child.material.metalness = 0.3; 
            }
        }
    });

    // B. Auto-escala y centrado automático en la rejilla
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size); 
    const center = new THREE.Vector3();
    box.getCenter(center); 

    model.position.x += (model.position.x - center.x);
    model.position.y += (model.position.y - center.y);
    model.position.z += (model.position.z - center.z);

    // Forzar a que mida 5 unidades de alto
    const targetHeight = 5.0; 
    const scaleFactor = targetHeight / size.y;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Apoyar la base en el suelo gris (Y = 0)
    const updatedBox = new THREE.Box3().setFromObject(model);
    model.position.y = -updatedBox.min.y; 

    // Añadir el modelo perfecto a la escena
    scene.add(model);

    // C. QUITAR LA PANTALLA DE CARGA
    // Nota: Si tu pantalla de carga tiene otra ID en el HTML (ej. "loader-container"), cámbiala aquí abajo:
    const loadingScreen = document.getElementById('loading-screen') || document.querySelector('.loading');
    if (loadingScreen) {
        loadingScreen.style.display = 'none'; // Desaparece el cartel de "Cargando..."
    }

}, function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% cargado');
}, function (error) {
    console.error('Error crítico al cargar el modelo:', error);
});

// ==========================================
// 4. BUCLE DE ANIMACIÓN (Renderizado continuo)
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Actualiza los movimientos del ratón
    renderer.render(scene, camera);
}
animate();

// Ajustar el 3D si el usuario cambia el tamaño de la ventana del navegador
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
