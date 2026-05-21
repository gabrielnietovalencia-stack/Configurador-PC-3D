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
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ── LUCES ──
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
fillLight.position.set(-5, -3, -5);
scene.add(fillLight);

// ── CUADRÍCULA (bug fix: guardar referencia antes de añadir) ──
const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// ── TRANSFORM CONTROLS ──
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('dragging-changed', e => { controls.enabled = !e.value; });
scene.add(transformControl);

// ── COMPATIBILIDAD ──
const COMPAT_DB = {
    'mobo_pro.glb':     { socket: 'AM4',     ramTipo: 'DDR4' },
    'mobo_generic.glb': { socket: 'AM4',     ramTipo: 'DDR4' },
    'mobo_z790.glb':    { socket: 'LGA1700', ramTipo: 'DDR5' },
    'mobo_b660.glb':    { socket: 'LGA1700', ramTipo: 'DDR4' },
    'cpu_5900x.glb':    { socket: 'AM4',     marca: 'amd'   },
    'cpu_5600x.glb':    { socket: 'AM4',     marca: 'amd'   },
    'cpu_i9.glb':       { socket: 'LGA1700', marca: 'intel' },
    'cpu_i5.glb':       { socket: 'LGA1700', marca: 'intel' },
    'ram_ddr4.glb':     { ramTipo: 'DDR4' },
    'ram_ddr5.glb':     { ramTipo: 'DDR5' },
};
const archivoActual = { caja: null, placa: null, cpu: null, ram: null, grafica: null };

function verificarCompatibilidad() {
    const errores = [];
    const placa = archivoActual.placa ? COMPAT_DB[archivoActual.placa] : null;
    const cpu   = archivoActual.cpu   ? COMPAT_DB[archivoActual.cpu]   : null;
    const ram   = archivoActual.ram   ? COMPAT_DB[archivoActual.ram]   : null;
    if (placa && cpu && placa.socket  !== cpu.socket)   errores.push(`Socket CPU (${cpu.socket}) incompatible con placa (${placa.socket})`);
    if (placa && ram && placa.ramTipo !== ram.ramTipo)  errores.push(`RAM ${ram.ramTipo} incompatible con placa (requiere ${placa.ramTipo})`);
    const todo = !!(archivoActual.placa && archivoActual.cpu && archivoActual.ram);
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada(errores, todo);
}

// ── NORMALIZACIÓN ──
const TAMAÑOS = { caja: 2.5, placa: 1.0, cpu: 0.45, ram: 0.7, grafica: 0.9 };
const SUELO   = -0.5;

function normalizarModelo(model, tipo) {
    const box1 = new THREE.Box3().setFromObject(model);
    const sz   = box1.getSize(new THREE.Vector3());
    const esc  = TAMAÑOS[tipo] / Math.max(sz.x, sz.y, sz.z);
    model.scale.setScalar(esc);
    const box2 = new THREE.Box3().setFromObject(model);
    const cnt  = box2.getCenter(new THREE.Vector3());
    model.position.x -= cnt.x;
    model.position.z -= cnt.z;
    model.position.y  = SUELO - box2.min.y + model.position.y;
    return esc;
}

// ── PLACEHOLDER CPU DETALLADO ──
function crearCPU(marca) {
    const g = new THREE.Group();
    const esIntel = (marca === 'intel');
    const pcbColor = esIntel ? 0x005060 : 0x006030;

    // PCB base
    const pcb = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.04, 1.05),
        new THREE.MeshStandardMaterial({ color: pcbColor, metalness: 0.2, roughness: 0.8 })
    );
    g.add(pcb);

    // Pines dorados (cuadrícula)
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.05 });
    const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 6);
    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            if (Math.abs(x) === 5 && Math.abs(z) === 5) continue;
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.set(x * 0.087, -0.03, z * 0.087);
            g.add(pin);
        }
    }

    // Condensadores alrededor
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.6, roughness: 0.4 });
    const capGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.05, 8);
    [[-0.45,0.04,0],[0.45,0.04,0],[0,0.04,-0.45],[0,0.04,0.45],
     [-0.45,0.04,0.22],[0.45,0.04,-0.22],[-0.22,0.04,0.45],[0.22,0.04,-0.45]
    ].forEach(([x,y,z]) => {
        g.add(Object.assign(new THREE.Mesh(capGeo, capMat), { position: new THREE.Vector3(x,y,z) }));
    });

    // IHS placa base
    g.add(Object.assign(
        new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.015, 0.82),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.95, roughness: 0.05 })),
        { position: new THREE.Vector3(0, 0.027, 0) }
    ));

    // IHS elevado
    const ihs = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.065, 0.75),
        new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 0.9, roughness: 0.08 })
    );
    ihs.position.y = 0.055;
    g.add(ihs);

    // Cara superior del IHS (más brillante)
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.005, 0.68),
        new THREE.MeshStandardMaterial({ color: 0xd8d8dc, metalness: 0.85, roughness: 0.04 })
    );
    top.position.y = 0.091;
    g.add(top);

    // Logo de color (Intel azul / AMD rojo)
    const logo = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.002, 0.07),
        new THREE.MeshStandardMaterial({ color: esIntel ? 0x0071c5 : 0xed1c24, metalness: 0, roughness: 1 })
    );
    logo.position.set(-0.12, 0.096, 0);
    g.add(logo);

    // Zona gris del IHS
    const gris = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.002, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x888890, metalness: 0.5, roughness: 0.6 })
    );
    gris.position.set(0.1, 0.096, 0);
    g.add(gris);

    return g;
}

// ── PLACEHOLDER RAM DETALLADO ──
function crearRAM(ramTipo) {
    const g = new THREE.Group();
    const esDDR5 = (ramTipo === 'DDR5');

    // PCB verde
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 1.5, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a, metalness: 0.1, roughness: 0.8 })
    ));

    // Disipador metálico
    const hs = new THREE.Mesh(
        new THREE.BoxGeometry(0.175, 1.12, 0.055),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x1a1a3a : 0x2a1a1a, metalness: 0.8, roughness: 0.3 })
    );
    hs.position.y = 0.18;
    g.add(hs);

    // Banda de color
    const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.176, 0.12, 0.057),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x5555ee : 0xcc2222, metalness: 0.6, roughness: 0.3 })
    );
    band.position.y = 0.62;
    g.add(band);

    // Aletas del disipador
    const alMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 });
    for (let i = -3; i <= 3; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.9, 0.008), alMat);
        fin.position.set(0, 0.18, 0.034 + i * 0.002);
        g.add(fin);
    }

    // Conector dorado
    const conn = new THREE.Mesh(
        new THREE.BoxGeometry(0.155, 0.22, 0.038),
        new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.9, roughness: 0.1 })
    );
    conn.position.y = -0.64;
    g.add(conn);

    // Pines del conector
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.05 });
    for (let i = -4; i <= 4; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.18, 0.04), pinMat);
        pin.position.set(i * 0.016, -0.64, 0);
        g.add(pin);
    }

    // Muesca anti-instalación-incorrecta
    const notch = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.25, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a })
    );
    notch.position.set(0.03, -0.64, 0);
    g.add(notch);

    return g;
}

function crearPlaceholder(tipo, nombreArchivo) {
    if (tipo === 'cpu') {
        const info = COMPAT_DB[nombreArchivo] || {};
        return crearCPU(info.marca || 'intel');
    }
    if (tipo === 'ram') {
        const info = COMPAT_DB[nombreArchivo] || {};
        return crearRAM(info.ramTipo || 'DDR4');
    }
    // Fallback genérico
    const g = new THREE.Group();
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6, roughness: 0.4 })
    ));
    return g;
}

// ── GUI ──
const TIPOS   = ['caja', 'placa', 'cpu', 'ram', 'grafica'];
const NOMBRES = { caja:'CAJA', placa:'PLACA BASE', cpu:'CPU', ram:'RAM', grafica:'GRÁFICA' };
const ICONOS  = { caja:'📦',   placa:'🎛️',          cpu:'🔲',  ram:'💾',  grafica:'🎮' };

let piezasActivas  = { caja:null, placa:null, cpu:null, ram:null, grafica:null };
let preciosActivos = { caja:0,    placa:0,    cpu:0,   ram:0,   grafica:0    };

const gui    = new GUI({ title: '🛠️ Calibrador 3D Avanzado' });
const params = { piezaAEditar:'Ninguna', modoRaton:'translate', autoRotar:false };
TIPOS.forEach(t => {
    params[t+'_Scale'] = 1;
    params[t+'_X'] = 0; params[t+'_Y'] = 0; params[t+'_Z'] = 0;
    params[t+'_RotX'] = 0; params[t+'_RotY'] = 0; params[t+'_RotZ'] = 0;
});

const fr = gui.addFolder('🧲 HERRAMIENTAS DE RATÓN');
fr.add(params,'piezaAEditar',['Ninguna','Caja','Placa','CPU','RAM','Grafica'])
    .name('👉 Agarrar pieza')
    .onChange(v => {
        const m = {Ninguna:null,Caja:'caja',Placa:'placa',CPU:'cpu',RAM:'ram',Grafica:'grafica'};
        const t = m[v];
        if (!t) { transformControl.detach(); return; }
        if (piezasActivas[t]) transformControl.attach(piezasActivas[t]);
    });
fr.add(params,'modoRaton',{Mover:'translate',Rotar:'rotate',Escalar:'scale'})
    .name('Acción')
    .onChange(v => transformControl.setMode(v));

TIPOS.forEach(t => {
    const f = gui.addFolder(ICONOS[t]+' '+NOMBRES[t]+' (Manual)');
    f.add(params,t+'_Scale',0.001,200,0.01).name('Escala')
        .onChange(v => { if (piezasActivas[t]) piezasActivas[t].scale.setScalar(v); });
    ['X','Y','Z'].forEach(e =>
        f.add(params,t+'_'+e,-10,10,0.01).name('Mover '+e)
            .onChange(v => { if (piezasActivas[t]) piezasActivas[t].position[e.toLowerCase()] = v; })
    );
    ['RotX','RotY','RotZ'].forEach(r =>
        f.add(params,t+'_'+r,-6.28,6.28,0.01).name('Rotar '+r.slice(-1))
            .onChange(v => { if (piezasActivas[t]) piezasActivas[t].rotation[r.slice(-1).toLowerCase()] = v; })
    );
    f.close();
});
gui.add(params,'autoRotar').name('🔄 Auto-Rotación');

transformControl.addEventListener('change', () => {
    const obj = transformControl.object;
    if (!obj) return;
    const t = TIPOS.find(t => piezasActivas[t] === obj);
    if (!t) return;
    params[t+'_X']    = obj.position.x; params[t+'_Y'] = obj.position.y; params[t+'_Z'] = obj.position.z;
    params[t+'_RotX'] = obj.rotation.x; params[t+'_RotY'] = obj.rotation.y; params[t+'_RotZ'] = obj.rotation.z;
    params[t+'_Scale'] = obj.scale.x;
    gui.controllersRecursive().forEach(c => c.updateDisplay());
});

// ── CARGA DE COMPONENTES ──
const loader = new GLTFLoader(loadingManager);

function actualizarTotal() {
    const el = document.getElementById('precio-total');
    if (el) el.innerText = Object.values(preciosActivos).reduce((a,b) => a+b, 0).toLocaleString('es-ES');
}

window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito, precio) {
    if (piezasActivas[tipo]) {
        if (transformControl.object === piezasActivas[tipo]) transformControl.detach();
        scene.remove(piezasActivas[tipo]);
        piezasActivas[tipo] = null;
    }
    preciosActivos[tipo] = precio;
    archivoActual[tipo]  = nombreArchivo;
    actualizarTotal();
    verificarCompatibilidad();

    const el = document.getElementById('txt-'+tipo);
    if (el) el.innerHTML = '<span style="color:#00ffff">⏳ '+nombreBonito+'...</span>';

    function colocar(model) {
        const esc = normalizarModelo(model, tipo);
        params[tipo+'_Scale'] = esc;
        params[tipo+'_X'] = model.position.x;
        params[tipo+'_Y'] = model.position.y;
        params[tipo+'_Z'] = model.position.z;
        params[tipo+'_RotX'] = params[tipo+'_RotY'] = params[tipo+'_RotZ'] = 0;
        gui.controllersRecursive().forEach(c => c.updateDisplay());
        scene.add(model);
        piezasActivas[tipo] = model;
        if (el) el.innerHTML = '<strong>'+NOMBRES[tipo]+':</strong> '+nombreBonito+' — '+precio.toLocaleString('es-ES')+'€';
    }

    loader.load(
        'models/'+nombreArchivo,
        gltf => colocar(gltf.scene),
        undefined,
        () => {
            console.warn('GLB no encontrado: '+nombreArchivo+' → placeholder 3D');
            colocar(crearPlaceholder(tipo, nombreArchivo));
        }
    );
};

window.reiniciarPC = function() {
    transformControl.detach();
    TIPOS.forEach(t => {
        if (piezasActivas[t]) { scene.remove(piezasActivas[t]); piezasActivas[t] = null; }
        preciosActivos[t] = 0; archivoActual[t] = null;
        params[t+'_Scale'] = 1;
        params[t+'_X'] = params[t+'_Y'] = params[t+'_Z'] = 0;
        params[t+'_RotX'] = params[t+'_RotY'] = params[t+'_RotZ'] = 0;
        const elT = document.getElementById('txt-'+t);
        if (elT) elT.innerHTML = '<span style="color:#4a6070">'+NOMBRES[t]+': —</span>';
    });
    gui.controllersRecursive().forEach(c => c.updateDisplay());
    actualizarTotal();
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada([], false);
};

// ── CARGA INICIAL (aquí, sin depender del timing del HTML) ──
window.cambiarComponente('caja',    'case_corsair.glb', 'Corsair iCUE 4000D',  150);
window.cambiarComponente('placa',   'mobo_pro.glb',     'ASUS Pro WS X570',    350);
window.cambiarComponente('cpu',     'cpu_5900x.glb',    'Ryzen 9 5900X',       550);
window.cambiarComponente('ram',     'ram_ddr4.glb',     'Kingston DDR4 32GB',   90);
window.cambiarComponente('grafica', 'gpu_4090.glb',     'RTX 4090',           2000);

// ── ANIMACIÓN ──
function animate() {
    requestAnimationFrame(animate);
    controls.autoRotate      = transformControl.object ? false : params.autoRotar;
    controls.autoRotateSpeed = 1.5;
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
