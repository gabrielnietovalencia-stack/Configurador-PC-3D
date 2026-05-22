import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

// ══════════════════════════════════════════════
// CONFIGURACIÓN DE POSICIÓN POR MODELO
// ══════════════════════════════════════════════
const CFG_CAJA = {
    escala: 4.38335949743193,
    pos: { x: -0.0012212289042001223, y: -0.46223731273980867, z: 0.004363321447276913 },
    rot: { x: 0, y: 0, z: 0 }
};
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
const CFG_CPU = {
    escala: 0.2,
    pos: { x: 0.39, y: 1.386, z: -0.631 },
    rot: { x: 0, y: -0.1, z: 1.59 }
};
const CFG_RAM = {
    escala: 0.28,
    pos: { x: 0.35, y: 1.3, z: -0.354 },
    rot: { x: 0, y: 0, z: 0 }
};

const CONFIG_MODELOS = {
    // Una sola caja
    'case_corsair.glb': CFG_CAJA,
    // Placas
    'mobo_pro.glb':     CFG_PLACA,
    'mobo_generic.glb': CFG_PLACA,
    'mobo_z790.glb':    CFG_PLACA,
    'mobo_b660.glb':    CFG_PLACA,
    // GPUs — 3090 usa las mismas coords que 4090
    'gpu_4090.glb':     CFG_GPU,
    'gpu_3090.glb':     CFG_GPU,
    // CPUs
    'cpu_i9.glb':       CFG_CPU,
    'cpu_i5.glb':       CFG_CPU,
    'cpu_5900x.glb':    CFG_CPU,
    'cpu_5600x.glb':    CFG_CPU,
    // RAM
    'ram_ddr4.glb':     CFG_RAM,
    'ram_ddr5.glb':     CFG_RAM,
};

const CONFIG_POR_DEFECTO = {
    caja: CFG_CAJA, placa: CFG_PLACA, cpu: CFG_CPU, ram: CFG_RAM, grafica: CFG_GPU
};

function aplicarConfig(model, nombreArchivo, tipo) {
    const cfg = CONFIG_MODELOS[nombreArchivo] || CONFIG_POR_DEFECTO[tipo]
              || { escala:1, pos:{x:0,y:0,z:0}, rot:{x:0,y:0,z:0} };
    model.scale.setScalar(cfg.escala);
    model.position.set(cfg.pos.x, cfg.pos.y, cfg.pos.z);
    model.rotation.set(cfg.rot.x, cfg.rot.y, cfg.rot.z);
}

// ══════════════════════════════════════════════
// COMPATIBILIDAD
// ══════════════════════════════════════════════
const COMPAT_DB = {
    'mobo_pro.glb':     { socket:'AM4',     ramTipo:'DDR4' },
    'mobo_generic.glb': { socket:'AM4',     ramTipo:'DDR4' },
    'mobo_z790.glb':    { socket:'LGA1700', ramTipo:'DDR5' },
    'mobo_b660.glb':    { socket:'LGA1700', ramTipo:'DDR4' },
    'cpu_5900x.glb':    { socket:'AM4',     marca:'amd'   },
    'cpu_5600x.glb':    { socket:'AM4',     marca:'amd'   },
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
    if (placa && cpu && placa.socket  !== cpu.socket)
        errores.push(`Socket CPU (${cpu.socket}) incompatible con placa (${placa.socket})`);
    if (placa && ram && placa.ramTipo !== ram.ramTipo)
        errores.push(`RAM ${ram.ramTipo} incompatible con placa (requiere ${placa.ramTipo})`);
    const todo = !!(archivoActual.placa && archivoActual.cpu && archivoActual.ram);
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada(errores, todo);
}

// ══════════════════════════════════════════════
// PLACEHOLDERS DETALLADOS
// (se usan cuando no existe el .glb en /models/)
// Tamaño en unidades Three.js — se escala con CFG_*
// ══════════════════════════════════════════════

// ── PLACA BASE ──
function crearPlacaBase(chipset) {
    const g = new THREE.Group();
    const esPremium = chipset === 'X570' || chipset === 'Z790';
    const S = 8; // factor de escala del placeholder (se compensa con CFG_PLACA.escala)

    // PCB verde oscuro
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(1.7*S, 0.04*S, 1.7*S),
        new THREE.MeshStandardMaterial({ color:0x1a2a1a, metalness:0.1, roughness:0.9 })
    ));

    // Socket CPU
    const socketBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.6*S, 0.05*S, 0.6*S),
        new THREE.MeshStandardMaterial({ color:0x0a0a0a, metalness:0.9, roughness:0.2 })
    );
    socketBase.position.set(-0.35*S, 0.045*S, -0.3*S); g.add(socketBase);
    const socketRim = new THREE.Mesh(
        new THREE.BoxGeometry(0.68*S, 0.025*S, 0.68*S),
        new THREE.MeshStandardMaterial({ color:0x303030, metalness:0.9, roughness:0.2 })
    );
    socketRim.position.set(-0.35*S, 0.032*S, -0.3*S); g.add(socketRim);

    // Pines del socket (cuadrícula 5x5)
    const pinM = new THREE.MeshStandardMaterial({ color:0xffd700, metalness:1, roughness:0.05 });
    const pinG = new THREE.CylinderGeometry(0.018*S, 0.018*S, 0.03*S, 6);
    for (let px=-2; px<=2; px++) for (let pz=-2; pz<=2; pz++) {
        const pin = new THREE.Mesh(pinG, pinM);
        pin.position.set((-0.35+px*0.085)*S, 0.055*S, (-0.3+pz*0.085)*S);
        g.add(pin);
    }


    const vrmMat = new THREE.MeshStandardMaterial({ color: esPremium ? 0x1a1a3a : 0x1a1a1a, metalness:0.8, roughness:0.3 });
    const vrmGeo = new THREE.BoxGeometry(0.13*S, 0.07*S, 0.13*S);
    [[-0.68,-0.32],[-0.54,-0.32],[-0.40,-0.32],[-0.68,-0.18],[-0.68,-0.04],[-0.68,0.10],[-0.54,0.10]].forEach(([x,z]) => {
        const v = new THREE.Mesh(vrmGeo, vrmMat);
        v.position.set(x*S, 0.055*S, z*S); g.add(v);
    });

   
    const capMat = new THREE.MeshStandardMaterial({ color:0x111120, metalness:0.5, roughness:0.5 });
    const capGeo = new THREE.CylinderGeometry(0.028*S, 0.028*S, 0.08*S, 8);
    [[-0.1,-0.1],[-0.1,0.06],[0.06,-0.1],[0.06,0.06],[-0.1,0.22],[0.06,0.22],[-0.25,-0.55],[0,-0.55]].forEach(([x,z]) => {
        const c = new THREE.Mesh(capGeo, capMat);
        c.position.set(x*S, 0.06*S, z*S); g.add(c);
    });

 
    const ramSlotMat = new THREE.MeshStandardMaterial({ color:0x0a0f0a, metalness:0.4, roughness:0.7 });
    const ramClipMat = new THREE.MeshStandardMaterial({ color:0x2a2a2a });
    [0.56, 0.70, 0.84, 0.98].forEach((x, i) => {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.07*S, 0.06*S, 1.05*S), ramSlotMat);
        slot.position.set(x*S, 0.05*S, -0.18*S); g.add(slot);
  
        [-0.72, 0.36].forEach(tz => {
            const clip = new THREE.Mesh(new THREE.BoxGeometry(0.08*S, 0.06*S, 0.06*S), ramClipMat);
            clip.position.set(x*S, 0.05*S, tz*S); g.add(clip);
        });
       
        if (i < 2) {
            const accent = new THREE.Mesh(new THREE.BoxGeometry(0.072*S, 0.01*S, 1.05*S),
                new THREE.MeshStandardMaterial({ color: esPremium ? 0x222255 : 0x333333 }));
            accent.position.set(x*S, 0.08*S, -0.18*S); g.add(accent);
        }
    });

    const pcieMat = new THREE.MeshStandardMaterial({ color:0x0a0a12, metalness:0.5, roughness:0.5 });
    [[0.08, 0.28, 1.5, true], [0.08, 0.50, 0.9, false], [0.08, 0.65, 1.5, false]].forEach(([x, z, w, primary]) => {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(w*S, 0.04*S, 0.055*S), pcieMat);
        slot.position.set(x*S, 0.04*S, z*S); g.add(slot);
    
        const rim = new THREE.Mesh(new THREE.BoxGeometry((w+0.04)*S, 0.02*S, 0.065*S),
            new THREE.MeshStandardMaterial({ color: primary ? 0xc8a000 : 0x444444, metalness:0.9 }));
        rim.position.set(x*S, 0.055*S, z*S); g.add(rim);
    });


    const chipGeo = new THREE.BoxGeometry(0.24*S, 0.04*S, 0.24*S);
    const chipMat = new THREE.MeshStandardMaterial({ color:0x111118, metalness:0.85, roughness:0.25 });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0.3*S, 0.04*S, 0.12*S); g.add(chip);

    const chipLabel = new THREE.Mesh(new THREE.BoxGeometry(0.18*S, 0.005*S, 0.08*S),
        new THREE.MeshStandardMaterial({ color: esPremium ? 0x0055aa : 0x444444, metalness:0 }));
    chipLabel.position.set(0.3*S, 0.062*S, 0.12*S); g.add(chipLabel);


    const sataMat = new THREE.MeshStandardMaterial({ color:0x222222, metalness:0.7, roughness:0.4 });
    for (let i=0; i<6; i++) {
        const sata = new THREE.Mesh(new THREE.BoxGeometry(0.045*S, 0.07*S, 0.11*S), sataMat);
        sata.position.set(0.78*S, 0.055*S, (0.05 + i*0.135)*S); g.add(sata);
        
        const tab = new THREE.Mesh(new THREE.BoxGeometry(0.04*S, 0.035*S, 0.025*S),
            new THREE.MeshStandardMaterial({ color:0xcc4400 }));
        tab.position.set(0.78*S, 0.072*S, (0.05 + i*0.135 + 0.065)*S); g.add(tab);
    }

 
    const io = new THREE.Mesh(new THREE.BoxGeometry(0.05*S, 0.18*S, 0.7*S),
        new THREE.MeshStandardMaterial({ color:0x1a1a1a, metalness:0.6, roughness:0.6 }));
    io.position.set(-0.86*S, 0.1*S, -0.52*S); g.add(io);
   
    for (let i=0; i<3; i++) {
        const usb = new THREE.Mesh(new THREE.BoxGeometry(0.06*S, 0.045*S, 0.06*S),
            new THREE.MeshStandardMaterial({ color:0x0a0a0a }));
        usb.position.set(-0.84*S, 0.1*S, (-0.65 + i*0.16)*S); g.add(usb);
    }

 
    const pwrMat = new THREE.MeshStandardMaterial({ color:0x111111, metalness:0.5, roughness:0.6 });
    const pwr = new THREE.Mesh(new THREE.BoxGeometry(0.07*S, 0.12*S, 0.32*S), pwrMat);
    pwr.position.set(0.84*S, 0.07*S, -0.62*S); g.add(pwr);

  
    const cpuPwr = new THREE.Mesh(new THREE.BoxGeometry(0.1*S, 0.1*S, 0.1*S), pwrMat);
    cpuPwr.position.set(-0.6*S, 0.07*S, -0.72*S); g.add(cpuPwr);


    if (esPremium) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(1.6*S, 0.006*S, 0.05*S),
            new THREE.MeshStandardMaterial({ color:0x0088ff, emissive:0x0044cc, emissiveIntensity:1.0 }));
        led.position.set(0, 0.022*S, 0.82*S); g.add(led);
      
        const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.05*S, 0.006*S, 1.4*S),
            new THREE.MeshStandardMaterial({ color:0x0088ff, emissive:0x0044cc, emissiveIntensity:0.6 }));
        led2.position.set(0.82*S, 0.022*S, -0.05*S); g.add(led2);
    }

    return g;
}


function crearCPU(marca) {
    const g = new THREE.Group();
    const esIntel = (marca === 'intel');
    const S = 5;


    const pcbMat = new THREE.MeshStandardMaterial({
        color: esIntel ? 0x004a58 : 0x005028,
        metalness:0.15, roughness:0.85
    });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.05*S, 0.045*S, 1.05*S), pcbMat));

    
    const pinMat = new THREE.MeshStandardMaterial({ color:0xffd700, metalness:1.0, roughness:0.04 });
    const pinGeo = new THREE.CylinderGeometry(0.016*S, 0.016*S, 0.03*S, 6);
    for (let x=-6; x<=6; x++) for (let z=-6; z<=6; z++) {
        if (Math.abs(x)===6 && Math.abs(z)===6) continue;
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(x*0.072*S, -0.035*S, z*0.072*S);
        g.add(pin);
    }

 
    const capMat = new THREE.MeshStandardMaterial({ color:0x1a1a2a, metalness:0.6, roughness:0.4 });
    const capGeo = new THREE.CylinderGeometry(0.025*S, 0.025*S, 0.06*S, 8);
    [[-0.44,0],[ 0.44,0],[0,-0.44],[0,0.44],[-0.44,-0.22],[0.44,0.22],[-0.22,0.44],[0.22,-0.44]].forEach(([x,z]) => {
        const c = new THREE.Mesh(capGeo, capMat);
        c.position.set(x*S, 0.05*S, z*S); g.add(c);
    });

  
    const smdMat = new THREE.MeshStandardMaterial({ color:0x333340, metalness:0.3, roughness:0.8 });
    for (let i=0; i<12; i++) {
        const angle = (i/12)*Math.PI*2;
        const r = 0.42*S;
        const smd = new THREE.Mesh(new THREE.BoxGeometry(0.04*S, 0.02*S, 0.025*S), smdMat);
        smd.position.set(Math.cos(angle)*r, 0.032*S, Math.sin(angle)*r);
        smd.rotation.y = angle;
        g.add(smd);
    }

   
    const ihsBaseMat = new THREE.MeshStandardMaterial({ color:0x999999, metalness:0.95, roughness:0.06 });
    const ihsBase = new THREE.Mesh(new THREE.BoxGeometry(0.84*S, 0.018*S, 0.84*S), ihsBaseMat);
    ihsBase.position.y = 0.03*S; g.add(ihsBase);

    
    const ihsMat = new THREE.MeshStandardMaterial({ color:0xcccccc, metalness:0.92, roughness:0.07 });
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.76*S, 0.07*S, 0.76*S), ihsMat);
    ihs.position.y = 0.059*S; g.add(ihs);

  
    const topMat = new THREE.MeshStandardMaterial({ color:0xdadade, metalness:0.88, roughness:0.04 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.70*S, 0.006*S, 0.70*S), topMat);
    top.position.y = 0.097*S; g.add(top);

 
    if (esIntel) {
 
        const notch = new THREE.Mesh(new THREE.BoxGeometry(0.09*S, 0.05*S, 0.18*S),
            new THREE.MeshStandardMaterial({ color:0x004a58 }));
        notch.position.set(-0.52*S, 0.025*S, -0.30*S); g.add(notch);
    } else {
      
        [-1, 1].forEach(side => {
            const notch = new THREE.Mesh(new THREE.BoxGeometry(0.12*S, 0.05*S, 0.05*S),
                new THREE.MeshStandardMaterial({ color:0x005028 }));
            notch.position.set(side*0.52*S, 0.025*S, 0); g.add(notch);
        });
    }


    const logoColor = esIntel ? 0x0071c5 : 0xed1c24;
    const logo = new THREE.Mesh(new THREE.BoxGeometry(0.22*S, 0.003*S, 0.08*S),
        new THREE.MeshStandardMaterial({ color:logoColor, emissive:logoColor, emissiveIntensity:0.15, roughness:1 }));
    logo.position.set(-0.1*S, 0.1*S, -0.05*S); g.add(logo);

 
    const grisRect = new THREE.Mesh(new THREE.BoxGeometry(0.30*S, 0.003*S, 0.20*S),
        new THREE.MeshStandardMaterial({ color:0x888892, roughness:0.7 }));
    grisRect.position.set(0.1*S, 0.1*S, 0.08*S); g.add(grisRect);

    return g;
}


function crearRAM(ramTipo) {
    const g = new THREE.Group();
    const esDDR5 = (ramTipo === 'DDR5');
    const S = 3.5;

   
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(0.16*S, 1.55*S, 0.045*S),
        new THREE.MeshStandardMaterial({ color:0x1a3a1a, metalness:0.1, roughness:0.85 })
    ));

   
    const chipMat = new THREE.MeshStandardMaterial({ color:0x111820, metalness:0.3, roughness:0.7 });
    for (let i=0; i<4; i++) {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.12*S, 0.18*S, 0.025*S), chipMat);
        chip.position.set(0, (-0.52 + i*0.02)*S, 0.036*S);
        g.add(chip);
    }

  
    const hsMat = new THREE.MeshStandardMaterial({
        color: esDDR5 ? 0x18183a : 0x2a1818,
        metalness:0.85, roughness:0.25
    });
    const hs = new THREE.Mesh(new THREE.BoxGeometry(0.178*S, 1.15*S, 0.062*S), hsMat);
    hs.position.y = 0.18*S; g.add(hs);

  
    const aletaMat = new THREE.MeshStandardMaterial({ color:0x111111, metalness:0.9, roughness:0.2 });
    for (let i=-3; i<=3; i++) {
        const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.006*S, 1.1*S, 0.008*S), aletaMat);
        aleta.position.set(i*0.02*S, 0.18*S, 0.038*S); g.add(aleta);
    }

  
    const bandColor = esDDR5 ? 0x3344ee : 0xcc1111;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.18*S, 0.14*S, 0.065*S),
        new THREE.MeshStandardMaterial({ color:bandColor, metalness:0.6, roughness:0.3 }));
    band.position.y = 0.64*S; g.add(band);

  
    const labelMat = new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x5566ff : 0xee2222, roughness:1 });
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.12*S, 0.06*S, 0.002*S), labelMat);
    label.position.set(0, 0.64*S, 0.04*S); g.add(label);

   
    const topPeak = new THREE.Mesh(new THREE.BoxGeometry(0.178*S, 0.06*S, 0.062*S),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x22224a : 0x3a2020, metalness:0.8 }));
    topPeak.position.y = 0.74*S; g.add(topPeak);

   
    const connMat = new THREE.MeshStandardMaterial({ color:0xb8860b, metalness:0.92, roughness:0.08 });
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.155*S, 0.24*S, 0.042*S), connMat);
    conn.position.y = -0.66*S; g.add(conn);

   
    const pinMat = new THREE.MeshStandardMaterial({ color:0xffd700, metalness:1.0, roughness:0.04 });
    for (let i=-5; i<=5; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.009*S, 0.20*S, 0.044*S), pinMat);
        pin.position.set(i*0.013*S, -0.66*S, 0); g.add(pin);
    }

    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.03*S, 0.26*S, 0.048*S),
        new THREE.MeshStandardMaterial({ color:0x1a3a1a }));
    notch.position.set(0.025*S, -0.66*S, 0); g.add(notch);

   
    if (esDDR5) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.14*S, 0.01*S, 0.003*S),
            new THREE.MeshStandardMaterial({ color:0x00aaff, emissive:0x0066cc, emissiveIntensity:0.8 }));
        led.position.set(0, 0.72*S, 0.04*S); g.add(led);
    }

    return g;
}

function crearGPU() {
    const g = new THREE.Group();
   
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(260, 110, 12),
        new THREE.MeshStandardMaterial({ color:0x0f0f18, metalness:0.3, roughness:0.7 })
    ));

    const cuerpo = new THREE.Mesh(
        new THREE.BoxGeometry(260, 110, 42),
        new THREE.MeshStandardMaterial({ color:0x202028, metalness:0.7, roughness:0.3 })
    );
    cuerpo.position.z = 25; g.add(cuerpo);

    [-75, 5, 85].forEach(x => {
        const fanRing = new THREE.Mesh(
            new THREE.CylinderGeometry(38, 38, 44, 32),
            new THREE.MeshStandardMaterial({ color:0x111118, metalness:0.5, roughness:0.5 })
        );
        fanRing.rotation.x = Math.PI/2;
        fanRing.position.set(x, 0, 26); g.add(fanRing);

        const fanInner = new THREE.Mesh(
            new THREE.CylinderGeometry(30, 30, 46, 32),
            new THREE.MeshStandardMaterial({ color:0x1a1a24, metalness:0.4, roughness:0.6 })
        );
        fanInner.rotation.x = Math.PI/2;
        fanInner.position.set(x, 0, 26); g.add(fanInner);

     
        for (let i=0; i<5; i++) {
            const angle = (i/5)*Math.PI*2;
            const aspa = new THREE.Mesh(
                new THREE.BoxGeometry(22, 8, 3),
                new THREE.MeshStandardMaterial({ color:0x252530, metalness:0.6, roughness:0.4 })
            );
            aspa.position.set(x + Math.cos(angle)*14, Math.sin(angle)*14, 26);
            aspa.rotation.z = angle; g.add(aspa);
        }

     
        const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 47, 12),
            new THREE.MeshStandardMaterial({ color:0x333340, metalness:0.7 })
        );
        hub.rotation.x = Math.PI/2;
        hub.position.set(x, 0, 26); g.add(hub);
    });

    for (let i=-10; i<=10; i++) {
        const aleta = new THREE.Mesh(
            new THREE.BoxGeometry(260, 2, 30),
            new THREE.MeshStandardMaterial({ color:0x333338, metalness:0.85, roughness:0.2 })
        );
        aleta.position.set(0, i*4.5, 15); g.add(aleta);
    }

    const conn = new THREE.Mesh(
        new THREE.BoxGeometry(160, 8, 6),
        new THREE.MeshStandardMaterial({ color:0xb8860b, metalness:0.95, roughness:0.08 })
    );
    conn.position.set(-40, -55, 0); g.add(conn);

   
    [70, 110].forEach(x => {
        const pwr = new THREE.Mesh(
            new THREE.BoxGeometry(28, 18, 14),
            new THREE.MeshStandardMaterial({ color:0x111118, metalness:0.5, roughness:0.6 })
        );
        pwr.position.set(x, 40, 10); g.add(pwr);
    });

    const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(8, 110, 12),
        new THREE.MeshStandardMaterial({ color:0x222228, metalness:0.7, roughness:0.4 })
    );
    bracket.position.set(134, 0, 0); g.add(bracket);

    const portMat = new THREE.MeshStandardMaterial({ color:0x0a0a0a });
    [-30, -10, 10, 30].forEach(y => {
        const port = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 5), portMat);
        port.position.set(134, y, -2); g.add(port);
    });

    return g;
}

function crearPlaceholder(tipo, nombreArchivo) {
    if (tipo === 'cpu') return crearCPU((COMPAT_DB[nombreArchivo]||{}).marca||'intel');
    if (tipo === 'ram') return crearRAM((COMPAT_DB[nombreArchivo]||{}).ramTipo||'DDR4');
    if (tipo === 'grafica') return crearGPU();
    if (tipo === 'placa') {
        const chipsets = { 'mobo_pro.glb':'X570','mobo_generic.glb':'B550','mobo_z790.glb':'Z790','mobo_b660.glb':'B660' };
        return crearPlacaBase(chipsets[nombreArchivo]||'B550');
    }
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),
        new THREE.MeshStandardMaterial({ color:0x334455, metalness:0.6, roughness:0.4 })));
    return g;
}

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
        if (window._guiParams && window._gui) {
            const p = window._guiParams;
            p[tipo+'_Scale'] = model.scale.x;
            p[tipo+'_X'] = model.position.x;
            p[tipo+'_Y'] = model.position.y;
            p[tipo+'_Z'] = model.position.z;
            window._gui.controllersRecursive().forEach(c => c.updateDisplay());
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


const gui = new GUI({ title: ' Calibrador' });
window._gui = gui;
const params = {}; window._guiParams = params;
TIPOS.forEach(t => {
    params[t+'_Scale']=1; params[t+'_X']=0; params[t+'_Y']=0; params[t+'_Z']=0;
    params[t+'_RotX']=0; params[t+'_RotY']=0; params[t+'_RotZ']=0;
});

['cpu','ram'].forEach(t => {
    const label = { cpu:'🔲 CPU', ram:'💾 RAM' }[t];
    const f = gui.addFolder(label);
    f.add(params,t+'_Scale',0.001,50,0.001).name('Escala').onChange(v=>{const m=CONTENEDORES[t].children[0];if(m)m.scale.setScalar(v);});
    f.add(params,t+'_X',-5,5,0.001).name('Mover X').onChange(v=>{const m=CONTENEDORES[t].children[0];if(m)m.position.x=v;});
    f.add(params,t+'_Y',-2,5,0.001).name('Mover Y').onChange(v=>{const m=CONTENEDORES[t].children[0];if(m)m.position.y=v;});
    f.add(params,t+'_Z',-5,5,0.001).name('Mover Z').onChange(v=>{const m=CONTENEDORES[t].children[0];if(m)m.position.z=v;});
    f.add(params,t+'_RotX',-6.28,6.28,0.001).name('Rotar X').onChange(v=>{const m=CONTENEDORES[t].children[0];if(m)m.rotation.x=v;});
    f.add(params,t+'_RotY',-6.28,6.28,0.001).name('Rotar Y').onChange(v=>{const m=CONTENEDORES[t].children[0];if(m)m.rotation.y=v;});
    f.add(params,t+'_RotZ',-6.28,6.28,0.001).name('Rotar Z').onChange(v=>{const m=CONTENEDORES[t].children[0];if(m)m.rotation.z=v;});
    const btns = {};
    btns['📋 Copiar '+t.toUpperCase()] = function() {
        const m = CONTENEDORES[t].children[0];
        if (!m) { alert('Carga primero el componente '+t); return; }
        const txt = `escala: ${m.scale.x},\npos: { x: ${m.position.x}, y: ${m.position.y}, z: ${m.position.z} },\nrot: { x: ${m.rotation.x}, y: ${m.rotation.y}, z: ${m.rotation.z} }`;
        console.log('=== '+t.toUpperCase()+' ===\n'+txt);
        alert('Coordenadas '+t.toUpperCase()+':\n\n'+txt);
    };
    f.add(btns,'📋 Copiar '+t.toUpperCase());
    f.open();
});

// ── ANIMACIÓN ──
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
window._appListo = true;
window.dispatchEvent(new Event('appListo'));
