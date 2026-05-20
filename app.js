import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

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
controls.enableDamping = true;   // ← Movimiento suave de cámara
controls.dampingFactor = 0.05;

// ========================================================
// 3. ILUMINACIÓN Y CUADRÍCULA
// ========================================================
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 8, 5);
scene.add(light);

// Luz de relleno desde abajo para que los modelos no queden oscuros por abajo
const lightFill = new THREE.DirectionalLight(0x8888ff, 0.4);
lightFill.position.set(-5, -3, -5);
scene.add(lightFill);

const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// ========================================================
// 4. TRANSFORM CONTROLS (HERRAMIENTA DE RATÓN)
// ========================================================
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('dragging-changed', function (event) {
    controls.enabled = !event.value;
});
scene.add(transformControl);

// ========================================================
// 5. NORMALIZACIÓN AUTOMÁTICA DE MODELOS  ← LA CLAVE
// ========================================================

// Tamaño objetivo para cada tipo de componente (en unidades Three.js)
// Ajusta estos valores si quieres que los componentes sean más grandes o pequeños
const TAMAÑOS_OBJETIVO = {
    caja:    2.5,   // La caja es el componente principal, más grande
    placa:   1.0,   // La placa base, mediana
    grafica: 0.9    // La GPU, un poco más pequeña que la placa
};

// Posición Y base de la escena (nivel del suelo)
const SUELO_Y = -0.5;

function normalizarModelo(model, tipo) {
    // Paso 1: calcular el bounding box del modelo TAL COMO VIENE del GLB
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Paso 2: calcular la escala para que quepa en el tamaño objetivo
    const escalaFinal = TAMAÑOS_OBJETIVO[tipo] / maxDim;
    model.scale.setScalar(escalaFinal);

    // Paso 3: re-calcular el bounding box con la nueva escala aplicada
    const box2 = new THREE.Box3().setFromObject(model);
    const centro = box2.getCenter(new THREE.Vector3());

    // Paso 4: centrar en X y Z, y posar el modelo sobre el suelo en Y
    model.position.x -= centro.x;
    model.position.z -= centro.z;
    model.position.y = SUELO_Y - box2.min.y + model.position.y;

    return escalaFinal;
}

// ========================================================
// 6. PANEL DE CALIBRACIÓN (GUI)
// ========================================================
let piezasActivas  = { caja: null, placa: null, grafica: null };
let preciosActivos = { caja: 0,    placa: 0,    grafica: 0 };

const gui = new GUI({ title: '🛠️ Calibrador 3D Avanzado' });

const params = {
    piezaAEditar: 'Ninguna',
    modoRaton: 'translate',
    caja_Scale: 1,    caja_X: 0,    caja_Y: 0,    caja_Z: 0,
    caja_RotX: 0,     caja_RotY: 0, caja_RotZ: 0,
    placa_Scale: 1,   placa_X: 0,   placa_Y: 0,   placa_Z: 0,
    placa_RotX: 0,    placa_RotY: 0,placa_RotZ: 0,
    grafica_Scale: 1, grafica_X: 0, grafica_Y: 0, grafica_Z: 0,
    grafica_RotX: 0,  grafica_RotY: 0, grafica_RotZ: 0,
    autoRotar: false
};

// --- HERRAMIENTAS DE RATÓN ---
const folderRaton = gui.addFolder('🧲 HERRAMIENTAS DE RATÓN');
folderRaton.add(params, 'piezaAEditar', ['Ninguna', 'Caja', 'Placa', 'Grafica'])
    .name('👉 Agarrar pieza')
    .onChange(v => {
        if (v === 'Ninguna')  transformControl.detach();
        if (v === 'Caja'    && piezasActivas.caja)    transformControl.attach(piezasActivas.caja);
        if (v === 'Placa'   && piezasActivas.placa)   transformControl.attach(piezasActivas.placa);
        if (v === 'Grafica' && piezasActivas.grafica) transformControl.attach(piezasActivas.grafica);
    });
folderRaton.add(params, 'modoRaton', { Mover: 'translate', Rotar: 'rotate', Escalar: 'scale' })
    .name('Acción')
    .onChange(v => transformControl.setMode(v));

// --- CAJA ---
const folderCaja = gui.addFolder('📦 CAJA (Manual)');
folderCaja.add(params, 'caja_Scale', 0.0001, 500, 0.01).name('Escala').onChange(v => { if (piezasActivas.caja) piezasActivas.caja.scale.setScalar(v); });
folderCaja.add(params, 'caja_X', -10, 10, 0.01).name('Mover X').onChange(v => { if (piezasActivas.caja) piezasActivas.caja.position.x = v; });
folderCaja.add(params, 'caja_Y', -10, 10, 0.01).name('Mover Y').onChange(v => { if (piezasActivas.caja) piezasActivas.caja.position.y = v; });
folderCaja.add(params, 'caja_Z', -10, 10, 0.01).name('Mover Z').onChange(v => { if (piezasActivas.caja) piezasActivas.caja.position.z = v; });
folderCaja.add(params, 'caja_RotX', -6.28, 6.28, 0.01).name('Rotar X').onChange(v => { if (piezasActivas.caja) piezasActivas.caja.rotation.x = v; });
folderCaja.add(params, 'caja_RotY', -6.28, 6.28, 0.01).name('Rotar Y').onChange(v => { if (piezasActivas.caja) piezasActivas.caja.rotation.y = v; });
folderCaja.add(params, 'caja_RotZ', -6.28, 6.28, 0.01).name('Rotar Z').onChange(v => { if (piezasActivas.caja) piezasActivas.caja.rotation.z = v; });
folderCaja.close();

// --- PLACA ---
const folderPlaca = gui.addFolder('🎛️ PLACA BASE (Manual)');
folderPlaca.add(params, 'placa_Scale', 0.0001, 500, 0.01).name('Escala').onChange(v => { if (piezasActivas.placa) piezasActivas.placa.scale.setScalar(v); });
folderPlaca.add(params, 'placa_X', -10, 10, 0.01).name('Mover X').onChange(v => { if (piezasActivas.placa) piezasActivas.placa.position.x = v; });
folderPlaca.add(params, 'placa_Y', -10, 10, 0.01).name('Mover Y').onChange(v => { if (piezasActivas.placa) piezasActivas.placa.position.y = v; });
folderPlaca.add(params, 'placa_Z', -10, 10, 0.01).name('Mover Z').onChange(v => { if (piezasActivas.placa) piezasActivas.placa.position.z = v; });
folderPlaca.add(params, 'placa_RotX', -6.28, 6.28, 0.01).name('Rotar X').onChange(v => { if (piezasActivas.placa) piezasActivas.placa.rotation.x = v; });
folderPlaca.add(params, 'placa_RotY', -6.28, 6.28, 0.01).name('Rotar Y').onChange(v => { if (piezasActivas.placa) piezasActivas.placa.rotation.y = v; });
folderPlaca.add(params, 'placa_RotZ', -6.28, 6.28, 0.01).name('Rotar Z').onChange(v => { if (piezasActivas.placa) piezasActivas.placa.rotation.z = v; });
folderPlaca.close();

// --- GRÁFICA ---
const folderGrafica = gui.addFolder('🎮 GRÁFICA (Manual)');
folderGrafica.add(params, 'grafica_Scale', 0.0001, 500, 0.01).name('Escala').onChange(v => { if (piezasActivas.grafica) piezasActivas.grafica.scale.setScalar(v); });
folderGrafica.add(params, 'grafica_X', -10, 10, 0.01).name('Mover X').onChange(v => { if (piezasActivas.grafica) piezasActivas.grafica.position.x = v; });
folderGrafica.add(params, 'grafica_Y', -10, 10, 0.01).name('Mover Y').onChange(v => { if (piezasActivas.grafica) piezasActivas.grafica.position.y = v; });
folderGrafica.add(params, 'grafica_Z', -10, 10, 0.01).name('Mover Z').onChange(v => { if (piezasActivas.grafica) piezasActivas.grafica.position.z = v; });
folderGrafica.add(params, 'grafica_RotX', -6.28, 6.28, 0.01).name('Rotar X').onChange(v => { if (piezasActivas.grafica) piezasActivas.grafica.rotation.x = v; });
folderGrafica.add(params, 'grafica_RotY', -6.28, 6.28, 0.01).name('Rotar Y').onChange(v => { if (piezasActivas.grafica) piezasActivas.grafica.rotation.y = v; });
folderGrafica.add(params, 'grafica_RotZ', -6.28, 6.28, 0.01).name('Rotar Z').onChange(v => { if (piezasActivas.grafica) piezasActivas.grafica.rotation.z = v; });
folderGrafica.close();

gui.add(params, 'autoRotar').name('🔄 Auto-Rotación');

// Sincronizar GUI cuando se arrastra con el ratón
transformControl.addEventListener('change', () => {
    const obj = transformControl.object;
    if (!obj) return;

    let tipo = null;
    if (obj === piezasActivas.caja)    tipo = 'caja';
    if (obj === piezasActivas.placa)   tipo = 'placa';
    if (obj === piezasActivas.grafica) tipo = 'grafica';
    if (!tipo) return;

    params[`${tipo}_X`]    = obj.position.x;
    params[`${tipo}_Y`]    = obj.position.y;
    params[`${tipo}_Z`]    = obj.position.z;
    params[`${tipo}_RotX`] = obj.rotation.x;
    params[`${tipo}_RotY`] = obj.rotation.y;
    params[`${tipo}_RotZ`] = obj.rotation.z;
    params[`${tipo}_Scale`]= obj.scale.x;
    gui.controllersRecursive().forEach(c => c.updateDisplay());
});

// ========================================================
// 7. LÓGICA DE CARGA DE COMPONENTES
// ========================================================
const loader = new GLTFLoader(loadingManager);

function actualizarPrecioTotal() {
    const total = preciosActivos.caja + preciosActivos.placa + preciosActivos.grafica;
    const elTotal = document.getElementById('precio-total');
    if (elTotal) elTotal.innerText = total;
}

window.cambiarComponente = function (tipo, nombreArchivo, nombreBonito, precio) {
    // Quitar modelo anterior
    if (piezasActivas[tipo]) {
        if (transformControl.object === piezasActivas[tipo]) transformControl.detach();
        scene.remove(piezasActivas[tipo]);
        piezasActivas[tipo] = null;
    }

    preciosActivos[tipo] = precio;
    actualizarPrecioTotal();

    // Mostrar indicador de carga en el menú
    const elTexto = document.getElementById(`txt-${tipo}`);
    if (elTexto) elTexto.innerHTML = `<span style="color:#00ffff">⏳ Cargando ${nombreBonito}...</span>`;

    loader.load(`models/${nombreArchivo}`, (gltf) => {
        const model = gltf.scene;

        // ↓↓ AQUÍ está la magia: normalizar el tamaño automáticamente ↓↓
        const escalaUsada = normalizarModelo(model, tipo);

        // Actualizar params con los valores reales post-normalización
        params[`${tipo}_Scale`] = escalaUsada;
        params[`${tipo}_X`]     = model.position.x;
        params[`${tipo}_Y`]     = model.position.y;
        params[`${tipo}_Z`]     = model.position.z;
        params[`${tipo}_RotX`]  = 0;
        params[`${tipo}_RotY`]  = 0;
        params[`${tipo}_RotZ`]  = 0;
        gui.controllersRecursive().forEach(c => c.updateDisplay());

        scene.add(model);
        piezasActivas[tipo] = model;

        if (elTexto) elTexto.innerHTML = `<strong>${tipo.toUpperCase()}:</strong> ${nombreBonito} — ${precio}€`;

    }, undefined, (error) => {
        console.error(`Error cargando ${nombreArchivo}:`, error);
        if (elTexto) elTexto.innerHTML = `<span style="color:#ef4444">❌ Error cargando ${nombreBonito}</span>`;
    });
};

window.reiniciarPC = function () {
    transformControl.detach();
    ['caja', 'placa', 'grafica'].forEach(tipo => {
        if (piezasActivas[tipo]) {
            scene.remove(piezasActivas[tipo]);
            piezasActivas[tipo] = null;
        }
        preciosActivos[tipo] = 0;
        const elTexto = document.getElementById(`txt-${tipo}`);
        if (elTexto) elTexto.innerHTML = `<span style="color:#555"><strong>${tipo.toUpperCase()}:</strong> -</span>`;

        // Reset params también
        params[`${tipo}_Scale`] = 1;
        params[`${tipo}_X`] = params[`${tipo}_Y`] = params[`${tipo}_Z`] = 0;
        params[`${tipo}_RotX`] = params[`${tipo}_RotY`] = params[`${tipo}_RotZ`] = 0;
    });
    gui.controllersRecursive().forEach(c => c.updateDisplay());
    actualizarPrecioTotal();
};

// Carga Inicial
cambiarComponente('caja',    'case_corsair.glb', 'Corsair iCUE', 150);
cambiarComponente('placa',   'mobo_pro.glb',     'ASUS Pro WS',  350);
cambiarComponente('grafica', 'gpu_4090.glb',     'RTX 40 ROG',  2000);

// ========================================================
// 8. BUCLE DE ANIMACIÓN
// ========================================================
function animate() {
    requestAnimationFrame(animate);

    if (transformControl.object) {
        controls.autoRotate = false;
    } else {
        controls.autoRotate = params.autoRotar;
    }

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
