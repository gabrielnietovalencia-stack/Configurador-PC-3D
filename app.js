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
}, 4000);

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {
    const pantalla = document.getElementById('pantalla-carga');
    if (pantalla) {
        pantalla.style.opacity = '0';
        setTimeout(() => { pantalla.style.display = 'none'; }, 500);
    }
};

// ========================================================
// 2. ESCENA Y CÁMARA
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
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ========================================================
// 3. ILUMINACIÓN Y CUADRÍCULA
// ========================================================
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 8, 5);
scene.add(light);
const lightFill = new THREE.DirectionalLight(0x8888ff, 0.4);
lightFill.position.set(-5, -3, -5);
scene.add(lightFill);

const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// ========================================================
// 4. TRANSFORM CONTROLS
// ========================================================
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('dragging-changed', e => { controls.enabled = !e.value; });
scene.add(transformControl);

// ========================================================
// 5. BASE DE DATOS DE COMPATIBILIDAD
// ========================================================
// socket    → el socket de CPU que acepta la placa, o el socket que tiene la CPU
// ramTipo   → tipo de RAM que acepta la placa, o el tipo que es la RAM
const COMPAT_DB = {
    // PLACAS BASE
    'mobo_pro.glb':     { socket: 'AM4',     ramTipo: 'DDR4' },
    'mobo_generic.glb': { socket: 'AM4',     ramTipo: 'DDR4' },
    'mobo_z790.glb':    { socket: 'LGA1700', ramTipo: 'DDR5' },
    'mobo_b660.glb':    { socket: 'LGA1700', ramTipo: 'DDR4' },
    // CPUs
    'cpu_5900x.glb':    { socket: 'AM4' },
    'cpu_5600x.glb':    { socket: 'AM4' },
    'cpu_i9.glb':       { socket: 'LGA1700' },
    'cpu_i5.glb':       { socket: 'LGA1700' },
    // RAM
    'ram_ddr4.glb':     { ramTipo: 'DDR4' },
    'ram_ddr5.glb':     { ramTipo: 'DDR5' },
    // GPU y Caja: siempre compatibles
    'gpu_4090.glb':     {},
    'gpu_3090.glb':     {},
    'case_corsair.glb': {},
    'case_fractal.glb': {},
};

// Archivo seleccionado actualmente por tipo
const archivoActual = { caja: null, placa: null, cpu: null, ram: null, grafica: null };

// ========================================================
// 6. VERIFICACIÓN DE COMPATIBILIDAD
// ========================================================
function verificarCompatibilidad() {
    const errores = [];

    const placa = archivoActual.placa ? COMPAT_DB[archivoActual.placa] : null;
    const cpu   = archivoActual.cpu   ? COMPAT_DB[archivoActual.cpu]   : null;
    const ram   = archivoActual.ram   ? COMPAT_DB[archivoActual.ram]   : null;

    // CPU vs Placa (socket)
    if (placa && cpu && placa.socket !== cpu.socket) {
        errores.push(`Socket CPU (${cpu.socket}) ≠ Placa (${placa.socket})`);
    }

    // RAM vs Placa (tipo DDR)
    if (placa && ram && placa.ramTipo !== ram.ramTipo) {
        errores.push(`RAM ${ram.ramTipo} ≠ Placa requiere ${placa.ramTipo}`);
    }

    const todoSeleccionado = !!(archivoActual.placa && archivoActual.cpu && archivoActual.ram);

    if (window.onCompatibilidadActualizada) {
        window.onCompatibilidadActualizada(errores, todoSeleccionado);
    }
}

// ========================================================
// 7. NORMALIZACIÓN AUTOMÁTICA DE TAMAÑO
// ========================================================
const TAMAÑOS_OBJETIVO = {
    caja:    2.5,
    placa:   1.0,
    cpu:     0.4,
    ram:     0.6,
    grafica: 0.9,
};

const SUELO_Y = -0.5;

function normalizarModelo(model, tipo) {
    const box1   = new THREE.Box3().setFromObject(model);
    const size   = box1.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const escala = TAMAÑOS_OBJETIVO[tipo] / maxDim;
    model.scale.setScalar(escala);

    const box2   = new THREE.Box3().setFromObject(model);
    const centro = box2.getCenter(new THREE.Vector3());
    model.position.x -= centro.x;
    model.position.z -= centro.z;
    model.position.y  = SUELO_Y - box2.min.y + model.position.y;
    return escala;
}

// Placeholder geométrico si falta el GLB
function crearPlaceholder(tipo) {
    const group = new THREE.Group();
    const mat   = new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.2 });
    let geo;
    switch (tipo) {
        case 'cpu':
            mat.color.set(0x999999);
            geo = new THREE.BoxGeometry(0.8, 0.06, 0.8);
            const chip = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.04, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
            );
            chip.position.y = 0.05;
            group.add(chip);
            break;
        case 'ram':
            mat.color.set(0x1a3a8a);
            geo = new THREE.BoxGeometry(0.12, 1.4, 0.35);
            break;
        default:
            mat.color.set(0x334455);
            geo = new THREE.BoxGeometry(1, 1, 1);
    }
    group.add(new THREE.Mesh(geo, mat));
    return group;
}

// ========================================================
// 8. GUI DE CALIBRACIÓN
// ========================================================
const TIPOS    = ['caja', 'placa', 'cpu', 'ram', 'grafica'];
const NOMBRES  = { caja: 'CAJA', placa: 'PLACA BASE', cpu: 'CPU', ram: 'RAM', grafica: 'GRÁFICA' };
const ICONOS   = { caja: '📦',   placa: '🎛️',          cpu: '🔲',  ram: '💾',  grafica: '🎮' };

let piezasActivas  = { caja: null, placa: null, cpu: null, ram: null, grafica: null };
let preciosActivos = { caja: 0,    placa: 0,    cpu: 0,   ram: 0,   grafica: 0    };

const gui    = new GUI({ title: '🛠️ Calibrador 3D Avanzado' });
const params = { piezaAEditar: 'Ninguna', modoRaton: 'translate', autoRotar: false };

TIPOS.forEach(t => {
    params[`${t}_Scale`] = 1;
    params[`${t}_X`] = 0; params[`${t}_Y`] = 0; params[`${t}_Z`] = 0;
    params[`${t}_RotX`] = 0; params[`${t}_RotY`] = 0; params[`${t}_RotZ`] = 0;
});

// Herramientas de ratón
const folderRaton = gui.addFolder('🧲 HERRAMIENTAS DE RATÓN');
folderRaton.add(params, 'piezaAEditar', ['Ninguna', 'Caja', 'Placa', 'CPU', 'RAM', 'Grafica'])
    .name('👉 Agarrar pieza')
    .onChange(v => {
        const mapa = { Ninguna: null, Caja: 'caja', Placa: 'placa', CPU: 'cpu', RAM: 'ram', Grafica: 'grafica' };
        const tipo = mapa[v];
        if (!tipo) { transformControl.detach(); return; }
        if (piezasActivas[tipo]) transformControl.attach(piezasActivas[tipo]);
    });
folderRaton.add(params, 'modoRaton', { Mover: 'translate', Rotar: 'rotate', Escalar: 'scale' })
    .name('Acción')
    .onChange(v => transformControl.setMode(v));

// Carpeta por cada tipo de componente
TIPOS.forEach(t => {
    const folder = gui.addFolder(`${ICONOS[t]} ${NOMBRES[t]} (Manual)`);
    folder.add(params, `${t}_Scale`, 0.001, 200, 0.01).name('Escala').onChange(v => { if (piezasActivas[t]) piezasActivas[t].scale.setScalar(v); });
    ['X','Y','Z'].forEach(eje => {
        folder.add(params, `${t}_${eje}`, -10, 10, 0.01).name(`Mover ${eje}`).onChange(v => { if (piezasActivas[t]) piezasActivas[t].position[eje.toLowerCase()] = v; });
    });
    ['RotX','RotY','RotZ'].forEach(r => {
        const eje = r.slice(-1).toLowerCase();
        folder.add(params, `${t}_${r}`, -6.28, 6.28, 0.01).name(`Rotar ${r.slice(-1)}`).onChange(v => { if (piezasActivas[t]) piezasActivas[t].rotation[eje] = v; });
    });
    folder.close();
});

gui.add(params, 'autoRotar').name('🔄 Auto-Rotación');

// Sincronizar GUI al mover con ratón
transformControl.addEventListener('change', () => {
    const obj = transformControl.object;
    if (!obj) return;
    const tipo = TIPOS.find(t => piezasActivas[t] === obj);
    if (!tipo) return;
    params[`${tipo}_X`]     = obj.position.x;
    params[`${tipo}_Y`]     = obj.position.y;
    params[`${tipo}_Z`]     = obj.position.z;
    params[`${tipo}_RotX`]  = obj.rotation.x;
    params[`${tipo}_RotY`]  = obj.rotation.y;
    params[`${tipo}_RotZ`]  = obj.rotation.z;
    params[`${tipo}_Scale`] = obj.scale.x;
    gui.controllersRecursive().forEach(c => c.updateDisplay());
});

// ========================================================
// 9. LÓGICA DE CARGA DE COMPONENTES
// ========================================================
const loader = new GLTFLoader(loadingManager);

function actualizarPrecioTotal() {
    const total = Object.values(preciosActivos).reduce((a, b) => a + b, 0);
    const el = document.getElementById('precio-total');
    if (el) el.innerText = total.toLocaleString('es-ES');
}

window.cambiarComponente = function (tipo, nombreArchivo, nombreBonito, precio) {
    if (piezasActivas[tipo]) {
        if (transformControl.object === piezasActivas[tipo]) transformControl.detach();
        scene.remove(piezasActivas[tipo]);
        piezasActivas[tipo] = null;
    }

    preciosActivos[tipo] = precio;
    archivoActual[tipo]  = nombreArchivo;
    actualizarPrecioTotal();
    verificarCompatibilidad();

    const elTexto = document.getElementById(`txt-${tipo}`);
    if (elTexto) elTexto.innerHTML = `<span style="color:#00ffff">⏳ ${nombreBonito}...</span>`;

    function colocarModelo(model) {
        const escala = normalizarModelo(model, tipo);
        params[`${tipo}_Scale`] = escala;
        params[`${tipo}_X`]    = model.position.x;
        params[`${tipo}_Y`]    = model.position.y;
        params[`${tipo}_Z`]    = model.position.z;
        params[`${tipo}_RotX`] = params[`${tipo}_RotY`] = params[`${tipo}_RotZ`] = 0;
        gui.controllersRecursive().forEach(c => c.updateDisplay());
        scene.add(model);
        piezasActivas[tipo] = model;
        if (elTexto) elTexto.innerHTML = `<strong>${NOMBRES[tipo]}:</strong> ${nombreBonito} &mdash; ${precio.toLocaleString('es-ES')}€`;
    }

    loader.load(
        `models/${nombreArchivo}`,
        gltf => colocarModelo(gltf.scene),
        undefined,
        () => {
            console.warn(`GLB no encontrado: ${nombreArchivo} → usando placeholder`);
            colocarModelo(crearPlaceholder(tipo));
        }
    );
};

window.reiniciarPC = function () {
    transformControl.detach();
    TIPOS.forEach(tipo => {
        if (piezasActivas[tipo]) { scene.remove(piezasActivas[tipo]); piezasActivas[tipo] = null; }
        preciosActivos[tipo] = 0;
        archivoActual[tipo]  = null;
        params[`${tipo}_Scale`] = 1;
        params[`${tipo}_X`] = params[`${tipo}_Y`] = params[`${tipo}_Z`] = 0;
        params[`${tipo}_RotX`] = params[`${tipo}_RotY`] = params[`${tipo}_RotZ`] = 0;
        const el = document.getElementById(`txt-${tipo}`);
        if (el) el.innerHTML = `<span style="color:#4a6070">${NOMBRES[tipo]}: —</span>`;
    });
    gui.controllersRecursive().forEach(c => c.updateDisplay());
    actualizarPrecioTotal();
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada([], false);
};

// Carga inicial
cambiarComponente('caja',    'case_corsair.glb', 'Corsair iCUE 4000D',  150);
cambiarComponente('placa',   'mobo_pro.glb',     'ASUS Pro WS X570',    350);
cambiarComponente('cpu',     'cpu_5900x.glb',    'Ryzen 9 5900X',       550);
cambiarComponente('ram',     'ram_ddr4.glb',     'Kingston DDR4 32GB',   90);
cambiarComponente('grafica', 'gpu_4090.glb',     'RTX 4090',           2000);

// ========================================================
// 10. BUCLE DE ANIMACIÓN
// ========================================================
function animate() {
    requestAnimationFrame(animate);
    controls.autoRotate      = transformControl.object ? false : params.autoRotar;
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
