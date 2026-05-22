import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// ── CARGA ──
setTimeout(() => {
    const p = document.getElementById('pantalla-carga');
    if (p) { p.style.opacity = '0'; setTimeout(() => p.style.display = 'none', 500); }
}, 4000);
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => {
    const p = document.getElementById('pantalla-carga');
    if (p) { p.style.opacity = '0'; setTimeout(() => p.style.display = 'none', 500); }
};

// ── ESCENA ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111116);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05;

// ── LUCES ──
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 8, 5); scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
fillLight.position.set(-5, -3, -5); scene.add(fillLight);
const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5; scene.add(gridHelper);

// ── TRANSFORM CONTROLS ──
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('dragging-changed', e => { controls.enabled = !e.value; });
scene.add(transformControl);

// ── CONFIGURACIÓN MANUAL POR MODELO ──

// Caja Base (Corsair)
const CFG_CAJA_BASE = {
    escala: 4.38335949743193,
    pos: { x: -0.0012212289042001223, y: -0.46223731273980867, z: 0.004363321447276913 },
    rot: { x: 0, y: 0, z: 0 }
};

// Placas Base
const CFG_PLACA = {
    escala: 0.23441940463062447,
    pos: { x: 0.44508416116312954, y: 1.2066575437401268, z: -0.6695229579883121 },
    rot: { x: 1.5739146500977332, y: 0.018214774560915116, z: 1.694773775031612 }
};


const CFG_GPU = {
    escala: 0.002822309152042788,
    pos: { x: 0.24930784974290898, y: 0.8782206284370628, z: -0.6530687989599044 },
    rot: { x: 3.0178850846808407, y: -1.5492430132602115, z: -1.7126768605325078 }
};

// CPU
const CFG_CPU = {
    escala: 0.2,
    pos: { x: 0.39, y: 1.386, z: -0.631 },
    rot: { x: 0, y: -0.1, z: 1.59 }
};

// RAM
const CFG_RAM = {
    escala: 0.28,
    pos: { x: 0.35, y: 1.3, z: -0.354 },
    rot: { x: 0, y: 0, z: 0 }
};

// ── CONFIGURACIÓN DE MODELOS ──
const CONFIG_MODELOS = {
    'case_corsair.glb': CFG_CAJA_BASE,

    'mobo_pro.glb':     CFG_PLACA,
    'mobo_generic.glb': CFG_PLACA,
    'mobo_z790.glb':    CFG_PLACA,
    'mobo_b660.glb':    CFG_PLACA,

    'gpu_4090.glb':     CFG_GPU,
    'gpu_3090.glb':     CFG_GPU, // Usa exactamente las mismas medidas de la 4090

    'cpu_i9.glb':       CFG_CPU,
    'cpu_i5.glb':       CFG_CPU,
    'cpu_5900x.glb':    CFG_CPU,
    'cpu_5600x.glb':    CFG_CPU,

    'ram_ddr4.glb':     CFG_RAM,
    'ram_ddr5.glb':     CFG_RAM,
};

const CONFIG_POR_DEFECTO = {
    caja:     CFG_CAJA_BASE,
    cpu:      CFG_CPU,
    ram:      CFG_RAM,
    placa:    CFG_PLACA,
    grafica:  CFG_GPU
};

function aplicarConfig(model, nombreArchivo, tipo) {
    const cfg = CONFIG_MODELOS[nombreArchivo] || CONFIG_POR_DEFECTO[tipo] || {
        escala: 1, pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 }
    };
    model.scale.setScalar(cfg.escala);
    model.position.set(cfg.pos.x, cfg.pos.y, cfg.pos.z);
    model.rotation.set(cfg.rot.x, cfg.rot.y, cfg.rot.z);
}

// ── COMPATIBILIDAD ──
const COMPAT_DB = {
    'mobo_pro.glb':     { socket:'AM4',      ramTipo:'DDR4' },
    'mobo_generic.glb': { socket:'AM4',      ramTipo:'DDR4' },
    'mobo_z790.glb':    { socket:'LGA1700', ramTipo:'DDR5' },
    'mobo_b660.glb':    { socket:'LGA1700', ramTipo:'DDR4' },
    'cpu_5900x.glb':    { socket:'AM4',      marca:'amd' },
    'cpu_5600x.glb':    { socket:'AM4',      marca:'amd' },
    'cpu_i9.glb':       { socket:'LGA1700', marca:'intel' },
    'cpu_i5.glb':       { socket:'LGA1700', marca:'intel' },
    'ram_ddr4.glb':     { ramTipo:'DDR4' },
    'ram_ddr5.glb':     { ramTipo:'DDR5' },
};
const archivoActual = { caja:null, placa:null, cpu:null, ram:null, grafica:null };

function verificarCompatibilidad() {
    const errores = [];
    const placa = archivoActual.placa ? COMPAT_DB[archivoActual.placa] : null;
    const cpu   = archivoActual.cpu   ? COMPAT_DB[archivoActual.cpu]   : null;
    const ram   = archivoActual.ram   ? COMPAT_DB[archivoActual.ram]   : null;
    if (placa && cpu && placa.socket  !== cpu.socket)  errores.push(`Socket CPU (${cpu.socket}) incompatible con placa (${placa.socket})`);
    if (placa && ram && placa.ramTipo !== ram.ramTipo) errores.push(`RAM ${ram.ramTipo} incompatible con placa (requiere ${placa.ramTipo})`);
    const todo = !!(archivoActual.placa && archivoActual.cpu && archivoActual.ram);
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada(errores, todo);
}

// ── PLACEHOLDERS (Por si no cargan los .glb) ──
function crearPlacaBase(chipset) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.03, 1.7), new THREE.MeshStandardMaterial({ color: 0x1a2a1a, metalness:0.1, roughness:0.9 })));
    return g;
}
function crearCPU(marca) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 1.05), new THREE.MeshStandardMaterial({ color: marca==='intel'?0x005060:0x006030 })));
    return g;
}
function crearRAM(ramTipo) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.04), new THREE.MeshStandardMaterial({ color: 0x1a3a1a })));
    return g;
}
function crearGPUPlaceholder() {
    const g = new THREE.Group();
    // Bloque proporcional al tamaño real de una GPU grande pre-escalada
    g.add(new THREE.Mesh(new THREE.BoxGeometry(140, 50, 300), new THREE.MeshStandardMaterial({ color: 0x25252b, metalness: 0.7, roughness: 0.3 })));
    return g;
}

function crearPlaceholder(tipo, nombreArchivo) {
    if (tipo === 'cpu') return crearCPU((COMPAT_DB[nombreArchivo]||{}).marca||'intel');
    if (tipo === 'ram') return crearRAM((COMPAT_DB[nombreArchivo]||{}).ramTipo||'DDR4');
    if (tipo === 'placa') return crearPlacaBase('B550');
    if (tipo === 'grafica') return crearGPUPlaceholder();
    
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({ color:0x334455 })));
    return g;
}

// ── CONTENEDORES Y PIEZAS ──
const TIPOS   = ['caja','placa','cpu','ram','grafica'];
const NOMBRES = { caja:'CAJA', placa:'PLACA BASE', cpu:'CPU', ram:'RAM', grafica:'GRÁFICA' };

const CONTENEDORES = {};
TIPOS.forEach(t => {
    const c = new THREE.Group(); c.name = 'cont_'+t;
    scene.add(c); CONTENEDORES[t] = c;
});

let preciosActivos  = { caja:0, placa:0, cpu:0, ram:0, grafica:0 };
const archivoEnCarga = {};
const loader = new GLTFLoader(loadingManager);

function actualizarTotal() {
    const el = document.getElementById('precio-total');
    if (el) el.innerText = Object.values(preciosActivos).reduce((a,b)=>a+b,0).toLocaleString('es-ES');
}

function limpiarContenedor(tipo) {
    const c = CONTENEDORES[tipo];
    while (c.children.length > 0) c.remove(c.children[0]);
}

window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito, precio) {
    const token = Date.now() + Math.random();
    archivoEnCarga[tipo] = token;
    limpiarContenedor(tipo);
    preciosActivos[tipo] = precio;
    archivoActual[tipo]  = nombreArchivo;
    actualizarTotal();
    verificarCompatibilidad();
    const el = document.getElementById('txt-'+tipo);
    if (el) el.innerHTML = '<span style="color:#00ffff">⏳ '+nombreBonito+'...</span>';

    function colocar(model) {
        if (archivoEnCarga[tipo] !== token) return;
        limpiarContenedor(tipo);
        aplicarConfig(model, nombreArchivo, tipo);
        CONTENEDORES[tipo].add(model);

        if (window._guiParams) {
            const p = window._guiParams;
            p[tipo+'_Scale'] = model.scale.x;
            p[tipo+'_X'] = model.position.x; p[tipo+'_Y'] = model.position.y; p[tipo+'_Z'] = model.position.z;
            if (window._gui) window._gui.controllersRecursive().forEach(c => c.updateDisplay());
        }
        if (el) el.innerHTML = '<strong>'+NOMBRES[tipo]+':</strong> '+nombreBonito+' — '+precio.toLocaleString('es-ES')+'€';
    }

    loader.load('models/'+nombreArchivo, gltf => colocar(gltf.scene), undefined, 
        () => colocar(crearPlaceholder(tipo, nombreArchivo)));
};

window.reiniciarPC = function() {
    TIPOS.forEach(t => {
        archivoEnCarga[t] = null; limpiarContenedor(t); preciosActivos[t] = 0; archivoActual[t] = null;
        const el = document.getElementById('txt-'+t);
        if (el) el.innerHTML = '<span style="color:#4a6070">'+NOMBRES[t]+': —</span>';
    });
    actualizarTotal();
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada([], false);
};

// ── ANIMACIÓN ──
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
window._appListo = true; window.dispatchEvent(new Event('appListo'));
