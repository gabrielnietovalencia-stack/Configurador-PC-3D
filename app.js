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

// Caja Corsair
const CFG_CAJA_CORSAIR = {
    escala: 4.38335949743193,
    pos: { x: -0.0012212289042001223, y: -0.46223731273980867, z: 0.004363321447276913 },
    rot: { x: 0, y: 0, z: 0 }
};

// Caja Fractal Design North (Separada para poder calibrarla de forma independiente)
const CFG_CAJA_FRACTAL = {
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

// GPU
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
    // CAJAS
    'case_corsair.glb':       CFG_CAJA_CORSAIR,
    'case_fractal.glb':       CFG_CAJA_FRACTAL,
    'case_fractal_north.glb': CFG_CAJA_FRACTAL, // Clon por si acaso se llama así en tu HTML

    // PLACAS BASE
    'mobo_pro.glb':     CFG_PLACA,
    'mobo_generic.glb': CFG_PLACA,
    'mobo_z790.glb':    CFG_PLACA,
    'mobo_b660.glb':    CFG_PLACA,

    // GPUs
    'gpu_4090.glb': CFG_GPU,
    'gpu_3090.glb': CFG_GPU,

    // CPUs
    'cpu_i9.glb':    CFG_CPU,
    'cpu_i5.glb':    CFG_CPU,
    'cpu_5900x.glb': CFG_CPU,
    'cpu_5600x.glb': CFG_CPU,

    // RAM
    'ram_ddr4.glb': CFG_RAM,
    'ram_ddr5.glb': CFG_RAM,
};

// ── CONFIGURACIÓN POR DEFECTO ──
const CONFIG_POR_DEFECTO = {
    caja:  CFG_CAJA_CORSAIR,
    cpu:   CFG_CPU,
    ram:   CFG_RAM,
    placa: CFG_PLACA
};

// ── APLICAR CONFIG ──
function aplicarConfig(model, nombreArchivo, tipo) {
    const cfg =
        CONFIG_MODELOS[nombreArchivo] ||
        CONFIG_POR_DEFECTO[tipo] ||
        {
            escala: 1,
            pos: { x: 0, y: 0, z: 0 },
            rot: { x: 0, y: 0, z: 0 }
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

// ── PLACEHOLDER PLACA BASE ──
function crearPlacaBase(chipset) {
    const g = new THREE.Group();
    const esPremium = chipset === 'X570' || chipset === 'Z790';
    const pcbColor = 0x1a2a1a;

    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.03, 1.7),
        new THREE.MeshStandardMaterial({ color: pcbColor, metalness:0.1, roughness:0.9 })));

    const socket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.55),
        new THREE.MeshStandardMaterial({ color:0x0a0a0a, metalness:0.8, roughness:0.3 }));
    socket.position.set(-0.35, 0.035, -0.3); g.add(socket);
    
    const socketMarco = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.62),
        new THREE.MeshStandardMaterial({ color:0x2a2a2a, metalness:0.9, roughness:0.2 }));
    socketMarco.position.set(-0.35, 0.025, -0.3); g.add(socketMarco);

    const vrmMat = new THREE.MeshStandardMaterial({ color: esPremium ? 0x1a1a3a : 0x1a1a1a, metalness:0.7, roughness:0.4 });
    const vrmGeo = new THREE.BoxGeometry(0.12, 0.055, 0.12);
    [[-0.65,-0.3],[-0.5,-0.3],[-0.35,-0.3],[-0.65,-0.15],[-0.65,0.0],[-0.65,0.15]].forEach(([x,z]) => {
        const v = new THREE.Mesh(vrmGeo, vrmMat); v.position.set(x, 0.042, z); g.add(v);
    });

    const capMat = new THREE.MeshStandardMaterial({ color:0x111120, metalness:0.5, roughness:0.5 });
    const capGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8);
    [[-0.1,-0.1],[-0.1,0.05],[0.05,-0.1],[0.05,0.05],[-0.1,0.2]].forEach(([x,z]) => {
        const c = new THREE.Mesh(capGeo, capMat); c.position.set(x, 0.045, z); g.add(c);
    });

    const ramSlotMat = new THREE.MeshStandardMaterial({ color:0x0a0f0a, metalness:0.4, roughness:0.6 });
    [0.55, 0.68, 0.81, 0.94].forEach(x => {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.0), ramSlotMat);
        slot.position.set(x, 0.04, -0.2); g.add(slot);
        const tab = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.06),
            new THREE.MeshStandardMaterial({ color:0x2a2a2a }));
        tab.position.set(x, 0.04, 0.32); g.add(tab);
    });

    const pcieMat = new THREE.MeshStandardMaterial({ color:0x0a0a12, metalness:0.5, roughness:0.5 });
    [0.1, 0.4, 0.55].forEach((z, i) => {
        const w = i === 0 ? 1.5 : (i === 1 ? 0.9 : 1.5);
        const slot = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, 0.05), pcieMat);
        slot.position.set(0.1, 0.03, z); g.add(slot);
        const rim = new THREE.Mesh(new THREE.BoxGeometry(w+0.05, 0.015, 0.06),
            new THREE.MeshStandardMaterial({ color: i===0 ? 0xc8a000 : 0x333333, metalness:0.9 }));
        rim.position.set(0.1, 0.038, z); g.add(rim);
    });

    const chipset3D = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.22),
        new THREE.MeshStandardMaterial({ color:0x111118, metalness:0.8, roughness:0.3 }));
    chipset3D.position.set(0.3, 0.032, 0.1); g.add(chipset3D);

    const sataMat = new THREE.MeshStandardMaterial({ color:0x222222, metalness:0.6, roughness:0.5 });
    for (let i=0; i<4; i++) {
        const sata = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.1), sataMat);
        sata.position.set(0.78, 0.045, 0.1 + i*0.12); g.add(sata);
    }

    const io = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.6),
        new THREE.MeshStandardMaterial({ color:0x1a1a1a, metalness:0.5, roughness:0.7 }));
    io.position.set(-0.85, 0.085, -0.55); g.add(io);

    if (esPremium) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.005, 0.04),
            new THREE.MeshStandardMaterial({ color:0x0088ff, emissive:0x0044aa, emissiveIntensity:0.8 }));
        led.position.set(0, 0.018, 0.8); g.add(led);
    }

    return g;
}

// ── PLACEHOLDER CPU ──
function crearCPU(marca) {
    const g = new THREE.Group();
    const esIntel = (marca === 'intel');
    const pcbColor = esIntel ? 0x005060 : 0x006030;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 1.05),
        new THREE.MeshStandardMaterial({ color:pcbColor, metalness:0.2, roughness:0.8 })));
    const pinMat = new THREE.MeshStandardMaterial({ color:0xffd700, metalness:1.0, roughness:0.05 });
    const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 6);
    for (let x=-5; x<=5; x++) for (let z=-5; z<=5; z++) {
        if (Math.abs(x)===5 && Math.abs(z)===5) continue;
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(x*0.087, -0.03, z*0.087); g.add(pin);
    }
    const capMat = new THREE.MeshStandardMaterial({ color:0x1a1a2a, metalness:0.6, roughness:0.4 });
    const capGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.05, 8);
    [[-0.45,0.04,0],[0.45,0.04,0],[0,0.04,-0.45],[0,0.04,0.45]].forEach(([x,y,z]) => {
        const c = new THREE.Mesh(capGeo, capMat); c.position.set(x,y,z); g.add(c);
    });
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.065, 0.75),
        new THREE.MeshStandardMaterial({ color:0xc8c8cc, metalness:0.9, roughness:0.08 }));
    ihs.position.y = 0.055; g.add(ihs);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.005, 0.68),
        new THREE.MeshStandardMaterial({ color:0xd8d8dc, metalness:0.85, roughness:0.04 }));
    top.position.y = 0.091; g.add(top);
    const logo = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.002, 0.07),
        new THREE.MeshStandardMaterial({ color: esIntel ? 0x0071c5 : 0xed1c24, roughness:1 }));
    logo.position.set(-0.12, 0.096, 0); g.add(logo);
    return g;
}

// ── PLACEHOLDER RAM ──
function crearRAM(ramTipo) {
    const g = new THREE.Group();
    const esDDR5 = (ramTipo === 'DDR5');
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.04),
        new THREE.MeshStandardMaterial({ color:0x1a3a1a, metalness:0.1, roughness:0.8 })));
    const hs = new THREE.Mesh(new THREE.BoxGeometry(0.175, 1.12, 0.055),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x1a1a3a : 0x2a1a1a, metalness:0.8, roughness:0.3 }));
    hs.position.y = 0.18; g.add(hs);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.176, 0.12, 0.057),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x5555ee : 0xcc2222, metalness:0.6, roughness:0.3 }));
    band.position.y = 0.62; g.add(band);
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.22, 0.038),
        new THREE.MeshStandardMaterial({ color:0xb8860b, metalness:0.9, roughness:0.1 }));
    conn.position.y = -0.64; g.add(conn);
    const pinMat = new THREE.MeshStandardMaterial({ color:0xffd700, metalness:1.0, roughness:0.05 });
    for (let i=-4; i<=4; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.18, 0.04), pinMat);
        pin.position.set(i*0.016, -0.64, 0); g.add(pin);
    }
    return g;
}

function crearPlaceholder(tipo, nombreArchivo) {
    if (tipo === 'cpu') return crearCPU((COMPAT_DB[nombreArchivo]||{}).marca||'intel');
    if (tipo === 'ram') return crearRAM((COMPAT_DB[nombreArchivo]||{}).ramTipo||'DDR4');
    if (tipo === 'placa') {
        const chipsets = { 'mobo_pro.glb':'X570','mobo_generic.glb':'B550','mobo_z790.glb':'Z790','mobo_b660.glb':'B660' };
        return crearPlacaBase(chipsets[nombreArchivo] || 'B550');
    }
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),
        new THREE.MeshStandardMaterial({ color:0x334455, metalness:0.6, roughness:0.4 })));
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

        // Actualizar GUI si existe
        if (window._guiParams) {
            const p = window._guiParams;
            p[tipo+'_Scale'] = model.scale.x;
            p[tipo+'_X'] = model.position.x; p[tipo+'_Y'] = model.position.y; p[tipo+'_Z'] = model.position.z;
            p[tipo+'_RotX'] = model.rotation.x; p[tipo+'_RotY'] = model.rotation.y; p[tipo+'_RotZ'] = model.rotation.z;
            if (window._gui) window._gui.controllersRecursive().forEach(c => c.updateDisplay());
        }

        if (el) el.innerHTML = '<strong>'+NOMBRES[tipo]+':</strong> '+nombreBonito+' — '+precio.toLocaleString('es-ES')+'€';
    }

    loader.load('models/'+nombreArchivo, gltf => colocar(gltf.scene), undefined,
        () => colocar(crearPlaceholder(tipo, nombreArchivo)));
};

window.reiniciarPC = function() {
    TIPOS.forEach(t => {
        archivoEnCarga[t] = null;
        limpiarContenedor(t);
        preciosActivos[t] = 0; archivoActual[t] = null;
        const el = document.getElementById('txt-'+t);
        if (el) el.innerHTML = '<span style="color:#4a6070">'+NOMBRES[t]+': —</span>';
    });
    actualizarTotal();
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada([], false);
};

// ── GUI DE CALIBRACIÓN (Cajas, CPU y RAM ahora disponibles) ──
const gui = new GUI({ title: '📐 Calibrador — Copia los valores' });
window._gui = gui;

const params = {};
window._guiParams = params;

TIPOS.forEach(t => {
    params[t+'_Scale'] = 1;
    params[t+'_X'] = 0; params[t+'_Y'] = 0; params[t+'_Z'] = 0;
    params[t+'_RotX'] = 0; params[t+'_RotY'] = 0; params[t+'_RotZ'] = 0;
});

// Agregada 'caja' al calibrador para que puedas reubicar tu Fractal Design North si es necesario
const folders = {};
['caja', 'cpu', 'ram'].forEach(t => {
    const label = { caja: '📦 CAJA', cpu:'🔲 CPU', ram:'💾 RAM' }[t];
    const f = gui.addFolder(label);
    f.add(params, t+'_Scale', 0.001, 50, 0.001).name('Escala').onChange(v => {
        const m = CONTENEDORES[t].children[0]; if (m) m.scale.setScalar(v);
    });
    f.add(params, t+'_X', -5, 5, 0.001).name('Mover X').onChange(v => {
        const m = CONTENEDORES[t].children[0]; if (m) m.position.x = v;
    });
    f.add(params, t+'_Y', -2, 5, 0.001).name('Mover Y').onChange(v => {
        const m = CONTENEDORES[t].children[0]; if (m) m.position.y = v;
    });
    f.add(params, t+'_Z', -5, 5, 0.001).name('Mover Z').onChange(v => {
        const m = CONTENEDORES[t].children[0]; if (m) m.position.z = v;
    });
    f.add(params, t+'_RotX', -6.28, 6.28, 0.001).name('Rotar X').onChange(v => {
        const m = CONTENEDORES[t].children[0]; if (m) m.rotation.x = v;
    });
    f.add(params, t+'_RotY', -6.28, 6.28, 0.001).name('Rotar Y').onChange(v => {
        const m = CONTENEDORES[t].children[0]; if (m) m.rotation.y = v;
    });
    f.add(params, t+'_RotZ', -6.28, 6.28, 0.001).name('Rotar Z').onChange(v => {
        const m = CONTENEDORES[t].children[0]; if (m) m.rotation.z = v;
    });

    const acciones = {
        ['📋 Copiar '+t.toUpperCase()]: function() {
            const m = CONTENEDORES[t].children[0];
            if (!m) { console.warn('No hay modelo de '+t); return; }
            const txt = `// ${t}\nescala: ${m.scale.x},\npos: { x: ${m.position.x}, y: ${m.position.y}, z: ${m.position.z} },\nrot: { x: ${m.rotation.x}, y: ${m.rotation.y}, z: ${m.rotation.z} }`;
            console.log('=== COORDENADAS '+t.toUpperCase()+' ===\n'+txt);
            alert('Coordenadas de '+t.toUpperCase()+' copiadas en la consola (F12):\n\n'+txt);
        }
    };
    f.add(acciones, '📋 Copiar '+t.toUpperCase());
    f.open();
    folders[t] = f;
});

// ── ANIMACIÓN ──
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

window._appListo = true;
window.dispatchEvent(new Event('appListo'));
