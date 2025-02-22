import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/loaders/GLTFLoader.js"; // ✅ Use CDN
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/loaders/FBXLoader.js';


// ==============================================
// Scene, Camera, Renderer Setup and orbit controlls
// ==============================================
let canvas = document.querySelector(".webgl");
let scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

let sizes = { width: window.innerWidth, height: window.innerHeight };

let camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 10000);
camera.position.set(-300, 15, 30);
scene.add(camera);


let renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5; 
renderer.outputColorSpace = THREE.SRGBColorSpace;

let controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 5;  
controls.dampingFactor = 0.05;

//new canvas
let portfolioCanvas;
let portfolioScene, portfolioCamera, portfolioRenderer;
let isTeleporting = false;

let portfolioControls;
const floatingObjects = [];

let bgMusic;
let clickSound;
let teleportSound;
let secondport;

// Loading Manager and UI Elements
const loadingManager = new THREE.LoadingManager(
    () => {
        document.querySelector('.loading-container').style.display = 'none';
        showSystemMessage();


          // Initialize background music
          bgMusic = new Audio('sounds/intro.mp3');
          bgMusic.loop = false;  // Play only once
          bgMusic.volume = 0.5;

          clickSound = new Audio('sounds/click1.wav');
          clickSound.volume = 0.7;

          teleportSound = new Audio('sounds/portal1.mp3'); 
          teleportSound.volume = 0.5;

          secondport = new Audio('sounds/portal2.mp3'); 
          secondport.volume = 0.5;
          
          // Handle autoplay restrictions
          bgMusic.play().catch(error => {
            console.log('Autoplay blocked - music requires user interaction');
        });
    },
    (item, loaded, total) => {
        const progress = (loaded / total) * 100;
        const circularProgress = document.querySelector('.circular-progress');
        const progressValue = document.querySelector('.progress-value');
        
        // Update progress value
        progressValue.textContent = `${Math.round(progress)}%`;
        
        // Update conic gradient
        circularProgress.style.background = 
            `conic-gradient(#00f7ff ${progress * 3.6}deg, #000 0deg)`;
    }
);
// Create loading screen
const loadingHTML = `
<div class="loading-container">
  <div class="circular-progress">
    <div class="progress-value">0%</div>
  </div>
  <div class="loading-text">System Initializing</div>
</div>`;
document.body.insertAdjacentHTML('beforeend', loadingHTML);

// System message styling
const systemMessageHTML = `
<div class="system-message">
    <div class="system-content">
        <div class="system-text"></div>
        <div class="system-prompt">Press Arrow Down Key ↓ To Move</div>
    </div>
</div>`;
document.body.insertAdjacentHTML('beforeend', systemMessageHTML);

function showSystemMessage() {
    const systemMessage = document.querySelector('.system-message');
    const textElement = document.querySelector('.system-text');
    const fullText = "WELCOME TO THE 3D WORLD 🌐 . . .";
    
    systemMessage.style.display = 'flex';
    
    let index = 0;
    const typeWriter = setInterval(() => {
        textElement.textContent += fullText[index];
        index++;
        if (index === fullText.length) {
            clearInterval(typeWriter);
            document.querySelector('.system-prompt').style.opacity = '1';
        }
    }, 50);
}

let tvTextVisible = false;
let teleportSphere = null;

const tvTextCSS = `
.tv-message {
    position: fixed;
    font-family: 'Courier New', monospace;
    font-size: 1.2em;
    color: #00ff9d;
    background: linear-gradient(45deg, rgba(0,20,0,0.9) 0%, rgba(0,40,20,0.9) 100%);
    border: 2px solid #00ff9d;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 0 40px rgba(0, 255, 157, 0.4);
    display: none;
    z-index: 1002;
    width: 350px;
    text-align: center;
    text-shadow: 0 0 15px rgba(0, 255, 157, 0.6);
    backdrop-filter: blur(5px);
    line-height: 1.4;
    border-image: linear-gradient(45deg, #00ff9d, #00b8ff) 1;
    animation: border-glow 2s ease-in-out infinite;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.tv-message::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(transparent 50%, rgba(0, 255, 157, 0.1) 50%);
    background-size: 100% 4px;
    animation: scanline 2s linear infinite;
}

.tv-message::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 80px;
    background: #00ff9d;
    left: -100%;
    top: -90px;
    animation: connector-line 2s infinite;
    box-shadow: 0 0 20px rgba(0, 255, 157, 0.5);
    transform: translateX(-50%);
}

@keyframes connector-line {
    0% { height: 80px; opacity: 0; }
    50% { height: 100px; opacity: 1; }
    100% { height: 80px; opacity: 0; }
}

@keyframes border-glow {
    0% { box-shadow: 0 0 30px rgba(0, 255, 157, 0.3); }
    50% { box-shadow: 0 0 50px rgba(0, 255, 157, 0.6); }
    100% { box-shadow: 0 0 30px rgba(0, 255, 157, 0.3); }
}

@keyframes text-flicker {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 1; }
}

.tv-content {
    position: relative;
    z-index: 2;
    animation: text-flicker 0.01s infinite;
}

.system-prompt {
    margin-top: 15px;
    font-size: 0.9em;
    color: #00b8ff;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0.6; transform: scale(1); }
}

.teleport-effect {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,255,0,0.8) 0%, rgba(0,255,0,0) 70%);
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1003;
    display: none;
}

@keyframes scanline {
    0% { background-position: 0 0; }
    100% { background-position: 0 100%; }
}
`;
const style = document.createElement('style');
style.textContent = tvTextCSS;
document.head.appendChild(style);

const tvTextHTML = `
<div class="tv-message">
    <div class="tv-content"></div>
</div>
<div class="teleport-effect"></div>`;
document.body.insertAdjacentHTML('beforeend', tvTextHTML);

// Create teleportation shader material
const teleportShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        intensity: { value: 0 },
        colorStart: { value: new THREE.Color(0x003300) },
        colorEnd: { value: new THREE.Color(0x00ff00) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 colorStart;
        uniform vec3 colorEnd;
        varying vec2 vUv;

        void main() {
            float dist = distance(vUv, vec2(0.5));
            float pulse = sin(time * 3.0) * 0.1 + 0.9; // Pulsating effect
            float alpha = smoothstep(0.5, 0.0, dist) * intensity * pulse;

            // Dynamic color shift based on distance and intensity
            vec3 color = mix(colorStart, colorEnd, intensity * (1.0 - dist));
            gl_FragColor = vec4(color * (1.0 - dist * 2.0), alpha);
        }
    `,
    transparent: true,
    depthWrite: false
});

function applyTypewriterEffect(element, text) {
    
    element.textContent = '';
    if (element.typewriterInterval) clearInterval(element.typewriterInterval);
    
    let index = 0;
    element.typewriterInterval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
        } else {
            clearInterval(element.typewriterInterval);
        }
    }, 50);
}


const portalMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv - 0.5;
        float dist = length(uv);

        // Swirling vortex effect
        float angle = atan(uv.y, uv.x) + time * 0.5;
        float radius = length(uv);
        float vortex = sin(angle * 10.0 + time) * 0.1;

        // Dynamic pulsating rings
        float ring = sin(dist * 15.0 - time * 3.0) * 0.5 + 0.5;
        float glow = smoothstep(0.2, 0.25, ring) - smoothstep(0.25, 0.3, ring);

        // Shimmering grid overlay
        float grid = sin(uv.x * 50.0 + time * 2.0) * sin(uv.y * 50.0 + time * 2.0);
        grid = smoothstep(0.0, 0.01, grid);

        // Radiating wave animation
        float wave = sin(dist * 10.0 - time * 4.0) * 0.1;
        wave = smoothstep(0.1, 0.2, wave) - smoothstep(0.2, 0.3, wave);

        // Color gradient with futuristic vibe
        vec3 color = mix(vec3(0.0, 0.5, 1.0), vec3(1.0, 0.0, 1.0), ring);
        color += grid * 0.15;
        color += vec3(0.1, 0.1, 0.3) * vortex;
        color += wave * vec3(0.8, 0.2, 0.5);

        // Outer glow for the portal
        float outerGlow = smoothstep(0.4, 0.5, dist) - smoothstep(0.5, 0.6, dist);
        color += outerGlow * vec3(0.3, 0.6, 1.0);

        gl_FragColor = vec4(color, glow + outerGlow);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
});

// Create a mystical portal geometry
const portalGeometry = new THREE.CircleGeometry(2, 64);
const portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
portalMesh.position.set(-54.9, 5, 0);
portalMesh.scale.set(11, 11, 11);
portalMesh.rotation.y = Math.PI / 2;
scene.add(portalMesh);


// ==========================
// Loaders for Models and Textures
// ==========================
const loader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader();
// const fbxLoader = new FBXLoader(loadingManager);

// Wall and Floor Textures
const wallTextures = textureLoader.load("textures/wall-texture1.jpg");
const floorTextures = textureLoader.load("textures/wood-floor4.jpg");

// ==========================
// Lighting Setup
// ==========================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true; 
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.bottom = -30;
scene.add(sunLight);

// Load Sky Background
const skyTexture = textureLoader.load("textures/sky-envmap.jpg");
scene.background = skyTexture;

// ==========================
// Inner Room (Walls with Inside Texture)
// ==========================
const innerWallMaterial = new THREE.MeshStandardMaterial({ map: wallTextures, side: THREE.BackSide });
const innerRoomGeometry = new THREE.BoxGeometry(100, 50, 100);
const innerRoomMesh = new THREE.Mesh(innerRoomGeometry, innerWallMaterial);
innerRoomMesh.position.y = 12.5;
scene.add(innerRoomMesh);

// ==========================
// Outer Shell (Walls with Outside Color)
// ==========================
const outerWallMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, side: THREE.FrontSide }); 
const outerShellGeometry = new THREE.BoxGeometry(101, 51, 101); 
const outerShellMesh = new THREE.Mesh(outerShellGeometry, outerWallMaterial);
outerShellMesh.position.y = 12.5;
scene.add(outerShellMesh);

// ==========================
// Inner Floor (Visible from Inside)
// ==========================
const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTextures, side: THREE.DoubleSide });
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.receiveShadow = true;
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -12.3;
scene.add(floorMesh);

// ==========================
// Outer Base (Hides Floor from Outside)
// ==========================
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B }); 
const baseGeometry = new THREE.PlaneGeometry(102, 102); 
const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
baseMesh.rotation.x = -Math.PI / 2;
baseMesh.position.y = -12.6; 
scene.add(baseMesh);

// ==========================
// Roof (Triangular Prism)
// ==========================
const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x964B00 }); 
const roofGeometry = new THREE.ConeGeometry(100, 40, 4); 
const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
roofMesh.position.y = 55; 
roofMesh.rotation.y = Math.PI / 4; 
scene.add(roofMesh);


// Load Portal Model above door
loader.load("models/final_portal.glb", (gltf) => {
    const portal = gltf.scene;
    portal.position.set(-167, 5, -56); 
    portal.scale.set(0.4, 0.4, 0.4);
    portal.rotation.y = Math.PI / 2; 
    portal.name = "portal"; 
    scene.add(portal);
});

// 🌳 Garden Floor
const grassTexture = textureLoader.load("textures/grass texture.jpg");
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 10);

const gardenMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });
const gardenGeometry = new THREE.PlaneGeometry(800, 800);
const gardenMesh = new THREE.Mesh(gardenGeometry, gardenMaterial);
gardenMesh.rotation.x = -Math.PI / 2;
gardenMesh.position.set(-55, -13, 0); 
gardenMesh.receiveShadow = true;
scene.add(gardenMesh);


// Load Fence Model
loader.load("models/Fence.glb", (gltf) => {
    const fence = gltf.scene;
    fence.scale.set(10, 15, 10); 

    const fencePositions = [
        { position: [-75, -20 + 15 / 2, -105], rotation: [0, 0, 0] },   
        { position: [-25, -20 + 15 / 2, -105], rotation: [0, 0, 0] },   
        { position: [25, -20 + 15 / 2, -105], rotation: [0, 0, 0] },    
        { position: [75, -20 + 15 / 2, -105], rotation: [0, 0, 0] },    

        { position: [-75, -20 + 15 / 2, 105], rotation: [0, 0, 0] },    
        { position: [-25, -20 + 15 / 2, 105], rotation: [0, 0, 0] },    
        { position: [25, -20 + 15 / 2, 105], rotation: [0, 0, 0] },     
        { position: [75, -20 + 15 / 2, 105], rotation: [0, 0, 0] },     

        { position: [-105, -20 + 15 / 2, -75], rotation: [0, Math.PI / 2, 0] },  
        { position: [-105, -20 + 15 / 2, 75], rotation: [0, Math.PI / 2, 0] },   

        { position: [105, -20 + 15 / 2, -75], rotation: [0, -Math.PI / 2, 0] },  
        { position: [105, -20 + 15 / 2, -25], rotation: [0, -Math.PI / 2, 0] },  
        { position: [105, -20 + 15 / 2, 25], rotation: [0, -Math.PI / 2, 0] },   
        { position: [105, -20 + 15 / 2, 75], rotation: [0, -Math.PI / 2, 0] }    
    ];

    // Add the fences to the scene
    fencePositions.forEach(({ position, rotation }) => {
        const fenceClone = fence.clone();
        fenceClone.position.set(...position);
        fenceClone.rotation.set(...rotation);
        scene.add(fenceClone);
    });
});


// Load Tree Model
loader.load("models/Tree.glb", (gltf) => {
    const tree = gltf.scene;
    tree.scale.set(5, 5, 5);  

    const leftTreePositions = [
        { position: [-85, -20.2 + 15 / 2, -85], rotation: [0, Math.PI / 2, 0] },  
        { position: [85, -20.2 + 15 / 2, -85], rotation: [0, Math.PI / 2, 0] },   
        { position: [-85, -20.2 + 15 / 2, 85], rotation: [0, Math.PI / 2, 0] },
        { position: [85, -20.2 + 15 / 2, 85], rotation: [0, Math.PI / 2, 0] },
    ];

    leftTreePositions.forEach(({ position, rotation }) => {
        const treeClone = tree.clone();
        treeClone.position.set(...position);
        treeClone.rotation.set(...rotation);
        scene.add(treeClone);
    });
});


// Load Gate Model
loader.load("models/Graveyard Gate.glb", (gltf) => {
    const gate = gltf.scene;
    gate.scale.set(15, 10, 15); 
    const gatePosition = { position: [-120, -1 + 15 / 2, 0], rotation: [0, Math.PI / 2, 0] };
    gate.position.set(...gatePosition.position);
    gate.rotation.set(...gatePosition.rotation);
    scene.add(gate);
});

// Load Path Model
loader.load("models/Path Straight.glb", (gltf) => {
    const path = gltf.scene;
    path.scale.set(150, 50, 210); 
    const pathPosition = { position: [-200, -15 + 1 / 2, 0], rotation: [0, Math.PI / 2, 0] };
    path.position.set(...pathPosition.position);
    path.rotation.set(...pathPosition.rotation);
    scene.add(path);
});

// ==========================
// TV and Video Setup
// ==========================
const tvMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const tvGeometry = new THREE.BoxGeometry(35, 19, 0.5); 
const tvMesh = new THREE.Mesh(tvGeometry, tvMaterial);
tvMesh.position.set(0, 19, -49.8);
scene.add(tvMesh);

// ==========================
// TV Back Panel (Blocks View from Outside)
// ==========================
const backPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.FrontSide });
const backPanelGeometry = new THREE.PlaneGeometry(35, 19);
const backPanelMesh = new THREE.Mesh(backPanelGeometry, backPanelMaterial);
backPanelMesh.position.set(0, 19, -50.1); 
scene.add(backPanelMesh);

// ==========================
// Video Textures
// ==========================
const videoSources = ["video.webm"];
let currentVideoIndex = 0;
const video = document.createElement("video");
video.src = videoSources[currentVideoIndex];
video.loop = true;
video.muted = false;
video.setAttribute("playsinline", "");

// ==========================
// Function to setup video texture
// ==========================
let videoTexture; 
function videoTextureSetup() {
    video.load(); 

    if (!videoTexture) {
        videoTexture = new THREE.VideoTexture(video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
    }

    const screenGeometry = new THREE.PlaneGeometry(34, 18);
    const screenMaterial = new THREE.MeshBasicMaterial({ 
        map: videoTexture, 
        side: THREE.FrontSide 
    });

    const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    screenMesh.position.set(0, 19, -49.5); 
    screenMesh.name = "screenMesh";
    scene.add(screenMesh);
}

videoTextureSetup();


loader.load("GLB/Couch.glb", (gltf) => {
  const sofa = gltf.scene;
  sofa.position.set(0, -7, 22);
  sofa.scale.set(22, 22, 22);
  sofa.rotation.y = -Math.PI / 2;

  sofa.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;  
      child.receiveShadow = true; 
      child.material.roughness = 0.4; 
    }
  });
  scene.add(sofa);
});


let fanModel; 
loader.load("GLB/Ceiling fan.glb", (gltf) => {
    fanModel = gltf.scene;
    fanModel.position.set(0, 30.9, 0);
    fanModel.scale.set(0.03, 0.03, 0.03); 
    scene.add(fanModel);
});


const moveSpeed = 1.3;
let path = [
    new THREE.Vector3(-24.9, -12.5, 0),  // Door position
    new THREE.Vector3(0, -8.5, 9)        // Sofa position
  ];
  let currentTargetIndex = 0;

let man, mixer, walkAction, sitAction;
let walking = false; 
let sitting = false;

const characterFbxLoader = new FBXLoader();
characterFbxLoader.load('Standing Idle.fbx', (fbx) => {
    man = fbx;
    man.scale.set(0.1, 0.1, 0.1);
    man.position.set(-240, -12.5, 15);
    man.rotation.y = Math.PI / 2;
    scene.add(man);

    mixer = new THREE.AnimationMixer(man);

    characterFbxLoader.load('Walking-2.fbx', (anim) => {
        walkAction = mixer.clipAction(anim.animations[0]);
    });
    
    characterFbxLoader.load('Stand To Sit.fbx', (anim) => {
        sitAction = mixer.clipAction(anim.animations[0]);
        sitAction.setLoop(THREE.LoopOnce); 
        sitAction.clampWhenFinished = true;
        
        mixer.addEventListener('finished', (e) => {
            if (e.action === sitAction) {
                setTimeout(() => {
                    tvTextVisible = true;
                    const tvMessage = document.querySelector('.tv-message');
                    const tvContent = document.querySelector('.tv-content');
                    tvMessage.style.display = 'block';
                    applyTypewriterEffect(tvContent, "WANT TO EXPLORE THE 3D PORTFOLIO ?\n\nCLICK ANY KEY\n\n...");
                    positionTVText();
                    window.addEventListener('resize', positionTVText);
                    window.addEventListener('keydown', handleTeleportKey);
                }, 1000);
            }
        });
    });
})


let isDragging = false;
let isOverInfoBox = false;
let portfolioLoadingManager;
let portfolioLoadingContainer;
let portfolioProgressBar;
let instructionText;

let isInfoFromClick = false;
let clickInfoTimeout = null;

let certificatesLoaded = false;
let certificateAnimationInterval = null;
const certificateTextures = [];
    

const portfolioLoadingCSS = `
.portfolio-loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    color: #00ff9d;
    font-family: 'Courier New', monospace;
}

.portfolio-loading-box {
    background: rgba(0, 20, 0, 0.8);
    padding: 2rem;
    border-radius: 10px;
    border: 2px solid #00ff9d;
    text-align: center;
}

.portfolio-progress-bar {
    width: 300px;
    height: 4px;
    background: #003300;
    margin: 1rem 0;
}

.portfolio-progress {
    height: 100%;
    background: #00ff9d;
    transition: width 0.3s ease;
}

.instruction-text {
    position: fixed;
    bottom: 40px;
    left: 250px;
    width: 70%;
    text-align: center;
    color:rgb(28, 28, 197);
    font-size: 1.5rem;
    text-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
    opacity: 0;
    transition: opacity 1s ease;
    pointer-events: none;
    z-index: 9999;
}
`;

const portfolioLoadingHTML = `
<div class="portfolio-loading">
    <div class="portfolio-loading-box">
        <div class="loading-text">INITIALIZING PORTFOLIO MATRIX</div>
        <div class="portfolio-progress-bar">
            <div class="portfolio-progress"></div>
        </div>
        <div class="loading-subtext">Loading neural pathways...</div>
    </div>
</div>
<div class="instruction-text">
    EXPLORE THE PORTFOLIO BY CLICKING OBJECTS
</div>`;


function positionTVText() {
    const tvPosition = new THREE.Vector3(0, 19, -49.5);
    const canvasRect = canvas.getBoundingClientRect();
    
    tvPosition.project(camera);
    const x = (tvPosition.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
    const y = (tvPosition.y * -0.5 + 0.5) * canvasRect.height + canvasRect.top;
    
    const tvMessage = document.querySelector('.tv-message');
    tvMessage.style.left = `${x + 100}px`; // Offset from TV
    tvMessage.style.top = `${y - 50}px`;
}

function handleTeleportKey(e) {
    if (!tvTextVisible || isTeleporting) return;
    isTeleporting = true;

    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.error('Click sound error:', e));
    }

    setTimeout(() => {
        if (secondport) {
            secondport.currentTime = 0;
            secondport.play().catch(e => console.error('Secondary sound error:', e));
        }
    }, 1500);
    
    document.querySelector('.system-message').style.display = 'none';
    document.querySelector('.tv-message').style.display = 'none';

    // Start teleportation effect
    const effect = document.querySelector('.teleport-effect');
    effect.style.display = 'block';

    // Create 3D teleportation sphere
    if (!teleportSphere) {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        teleportSphere = new THREE.Mesh(geometry, teleportShaderMaterial);
        teleportSphere.position.copy(man.position);
        scene.add(teleportSphere);
    }

    let scale = 5;
    const teleportSpeed = 0.1;
    let intensity = 0;

    function animateTeleport() {
        scale += teleportSpeed;
        intensity = Math.min(1, scale / 5);
        teleportShaderMaterial.uniforms.intensity.value = intensity;
        teleportShaderMaterial.uniforms.time.value += 0.1;
        teleportSphere.scale.set(scale, scale, scale);
        
        effect.style.width = `${scale * 50}vw`;
        effect.style.height = `${scale * 50}vw`;
        effect.style.opacity = 1 - (scale / 10);

        if (scale < 10) {
            requestAnimationFrame(animateTeleport);
        } else {
        portfolioCanvas = document.querySelector('.webgl-portfolio');
        const mainCanvas = document.querySelector('.webgl');

        mainCanvas.style.display = 'none';
        portfolioCanvas.style.display = 'block';

        initPortfolioScene();
        }
    }


    function initPortfolioScene() {
        portfolioCanvas = document.querySelector('.webgl-portfolio');

        document.body.insertAdjacentHTML('beforeend', portfolioLoadingHTML);
        const style = document.createElement('style');
        style.textContent = portfolioLoadingCSS;
        document.head.appendChild(style);
        
        portfolioLoadingContainer = document.querySelector('.portfolio-loading');
        portfolioProgressBar = document.querySelector('.portfolio-progress');
        instructionText = document.querySelector('.instruction-text');

        portfolioLoadingManager = new THREE.LoadingManager(
            () => {
                // On complete
                setTimeout(() => {
                    portfolioLoadingContainer.style.display = 'none';
                    instructionText.style.opacity = '1';
                    
                    setTimeout(() => {
                        gsap.to(instructionText, {
                            opacity: 0,
                            duration: 2,
                            ease: "power2.out"
                        });
                    }, 10000);
                }, 300);
            },
            (item, loaded, total) => {
                const progress = (loaded / total) * 100;
                portfolioProgressBar.style.width = `${progress}%`;
            }
        );


        const profileImage = new Image();
         profileImage.src = 'profile.jpg';
         profileImage.onload = () => {
        document.querySelector('.profile-pic').src = 'profile.jpg';
     };
        
        // const portfolioLoader = new GLTFLoader(portfolioLoadingManager);
        // const portfolioTextureLoader = new THREE.TextureLoader(portfolioLoadingManager);



        if (!portfolioCanvas) {
            portfolioCanvas = document.createElement('canvas');
            portfolioCanvas.className = 'webgl-portfolio';
            document.body.appendChild(portfolioCanvas);

        }

        // portfolioCanvas.removeEventListener('mousemove', onPortfolioMouseMove);
        // portfolioCanvas.removeEventListener('click', onPortfolioClick);

        //  portfolioCanvas.addEventListener('mousemove', onPortfolioMouseMove);
         portfolioCanvas.addEventListener('click', onPortfolioClick);

         portfolioCanvas.style.pointerEvents = 'auto';
        

          // Ensure canvas has proper size
        portfolioCanvas.width = window.innerWidth;
        portfolioCanvas.height = window.innerHeight;

        portfolioScene = new THREE.Scene();
        portfolioCamera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000);
        portfolioCamera.position.set(125, -5, -10);
        portfolioRenderer = new THREE.WebGLRenderer({ 
            canvas: portfolioCanvas,
            antialias: true,
            alpha: true
        });
        

        portfolioRenderer.setSize(sizes.width, sizes.height);
        portfolioRenderer.setClearColor(0x000000, 0); // Transparent background
        
        // Initialize controls
        portfolioControls = new OrbitControls(portfolioCamera, portfolioCanvas);
        portfolioControls.enableDamping = true;
        portfolioControls.dampingFactor = 0.05;
        // portfolioControls.enabled = false; // Start disabled

        // Set up portfolio scene
        loadPortfolioRoom();
        animatePortfolioScene();

        portfolioCanvas.addEventListener('mousedown', handleCanvasMouseDown);
        portfolioCanvas.addEventListener('mousemove', handleCanvasMouseMove);
        portfolioCanvas.addEventListener('mouseup', handleCanvasMouseUp);


        portfolioCanvas.addEventListener('dblclick', (event) => {
            const rect = portfolioCanvas.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            
            raycaster.setFromCamera(mouse, portfolioCamera);
            const intersects = raycaster.intersectObjects(portfolioScene.children, true);
        
            if (intersects.length > 0) {
                let obj = intersects[0].object;
                while (obj && !obj.name.includes("certificateScreen") && obj.parent) {
                    obj = obj.parent;
                }
        
                if (obj && obj.name === "certificateScreen" && obj.userData.isActive) {
                    obj.userData.toggle();
                }
            }
        });

    }


    function handleCanvasMouseDown(e) {
        isDragging = true;
        if (!isOverInfoBox) {
          portfolioControls.enabled = true;
        }
      }
      
      function handleCanvasMouseMove(e) {
        const rect = portfolioCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const infoDiv = document.querySelector('.object-info');
        
        // Check if mouse is over info box
        isOverInfoBox = infoDiv.classList.contains('visible') && 
                       x >= infoDiv.offsetLeft && 
                       x <= infoDiv.offsetLeft + infoDiv.offsetWidth &&
                       y >= infoDiv.offsetTop && 
                       y <= infoDiv.offsetTop + infoDiv.offsetHeight;
      }
      
      function handleCanvasMouseUp() {
        isDragging = false;
        portfolioControls.enabled = true;
      }
    
    
    animateTeleport();
    document.querySelector('.tv-message').style.display = 'none';
    tvTextVisible = false;
    


    // Create second canvas
    portfolioCanvas = document.querySelector('.webgl-portfolio');
    portfolioCanvas.style.display = 'block';
    
    
    // Initialize new scene
    portfolioScene = new THREE.Scene();
    portfolioScene.background = new THREE.Color(0x000000);
    
    // Set up new camera
    portfolioCamera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
    // Set camera initial position
    portfolioCamera.position.set(0, 50, 100);
    portfolioCamera.lookAt(0, 0, 0);
    
    // Set up new renderer
    portfolioRenderer = new THREE.WebGLRenderer({ 
        canvas: portfolioCanvas,
        antialias: true 
    });
    portfolioRenderer.setSize(sizes.width, sizes.height);
 

    // Load new room content
    loadPortfolioRoom();

    // Animation for transition
    gsap.to(".teleport-effect", {
        width: "100vw",
        height: "100vw",
        duration: 2,
        onComplete: () => {
            // Hide original scene
            canvas.style.display = 'none';
            document.querySelector('.system-message').style.display = 'none';
            portfolioCanvas.classList.add('portal-visible');
            
            // Initialize controls for new scene
            const portfolioControls = new OrbitControls(portfolioCamera, portfolioCanvas);
            portfolioControls.enableDamping = true;
            
            // Start animation for new scene
            animatePortfolioScene();
        }
    });
}


const infoDiv = document.querySelector('.object-info');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();



// Object interaction data
const objectInfoMap = {
    trophy: {
        title: "🏆 Achievements & Events",
        content: `Full Stack Hackathon and Boot Camp (2024):\n
              - Top 10 in CodeCamp Challenge with real-time scheduling web app
              - Recognized for innovative UI/UX in educational tech category\n\n
              Merit Scholarship Award (2023):\n
              - Awarded college-wide academic scholarship
              - Ranked in top 5% for 2nd year academic performance`
    },
    desk: {
        title: "💻 Development Skills",
        content: `➜ 3D & XR: Three.js, WebXR\n
                  ➜ Languages: Java, Python\n
                  ➜ Front End: JavaScript, React.js, Html, Css\n
                  ➜ Machine Learning: Predictive Modelling, TensorFlow, PyTorch, Scikit-learn\n
                  ➜ Cloud: AWS`
    },
    bookshelf: {
        title: "📚 Professional Experience",
        content: `➜ Current: Student Intern @PlugXR (2025)\n
                  - Developing AR/VR solutions using Three.js and WebXR frameworks
                  - Created 3D portfolio showcasing interactive product visualizations\n\n
                  ➜ ML Intern @DataPro (2024)\n
                  - Built predictive maintenance models reducing equipment downtime by 30%
                  - Developed interactive dashboards using Tableau for model performance visualization
                  - Optimized Random Forest algorithms achieving 92% prediction accuracy\n\n
                  ➜ Full Stack Intern @HMI Tech (2023)\n
                  - Revamped legacy systems using modern JavaScript (ES6+) and REST APIs
                  - Created responsive UI components achieving 98% Lighthouse accessibility score
                  - Integrated Mapbox APIs for real-time geolocation features`
    },
    chamber: {
        title: "🔬 Projects & Research",
        content: `➜ 3D Portfolio Suite:\n
                  - Developed interactive 3D web experiences using Three.js and WebXR
                  - Created AR-based portfolio with gesture-controlled 3D model viewer
                  - Implemented custom GLSL shaders for realistic material rendering\n\n
                  ➜ Smart Timetable Generator (Full Stack):\n
                  - Developed responsive frontend with React/Next.js drag-and-drop interface
                  - Designed RESTful backend APIs for schedule management and conflict resolution
                  - Implemented iCalendar standard integration for cross-platform compatibility\n\n
                  ➜ AgriGrowth Predictor (ML):\n
                  - Plant growth prediction model using multivariate regression
                  - Achieved 89% accuracy with TensorFlow and Scikit-learn
                  - Integrated weather API and soil sensor data visualization
                  - Deployed using Gradio Interface`
    },
    cap: {
        title: "👨🎓 Education",
        content: `➜ B.Tech in Computer Science
                  Sitam College (2022 - 2025)
                  Percentage: 71%\n
                  ➜ Diploma in Metallurgical Engineering
                  MRAGR Polytechnic College (2018 - 2021)
                  Percentage: 85%\n
                  ➜ Schooling
                  Hebron English Medium High School (2018)
                  Percentage: 85%\n`
    },
    linkedin: {
        title: "💼 LinkedIn Profile",
        content: `
          <div class="social-info">
            <p>Connect with me professionally</p>
            <a href="https://www.linkedin.com/in/indra-kumar-guda-983420279/" 
               target="_blank" 
               class="social-link">
               View Full Profile →
            </a>
          </div>`
      },
      github: {
        title: "👨💻 GitHub Profile",
        content: `
          <div class="social-info">
            <p>Explore my code repositories</p>
            <a href="https://github.com/indrakumarcse" 
               target="_blank" 
               class="social-link">
               Browse Projects →
            </a>
          </div>`
      }
};



function onPortfolioMouseMove(event) {
    if (!portfolioCanvas || !portfolioScene || !portfolioCamera) return;

    const rect = portfolioCanvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, portfolioCamera);
    const intersects = raycaster.intersectObjects(portfolioScene.children, true);

    if (intersects.length > 0) {
        let obj = intersects[0].object;
        let foundKey = null;

        // Traverse parent chain to find named object
        while (obj) {
            foundKey = Object.keys(objectInfoMap).find(key => 
                obj.name.toLowerCase().includes(key)
            );
            if (foundKey) break;
            obj = obj.parent;
        }

        if (foundKey) {
            hoveredObject = obj;
            showObjectInfo(objectInfoMap[foundKey], intersects[0].point);
            hoveredObject = null;
            hideObjectInfo();
        }
    } else {
        hoveredObject = null;
        hideObjectInfo();
    }

    if (intersects.length === 0 && !isInfoFromClick) {
        hideObjectInfo();
    }
}

function onPortfolioClick(event) {
    if (!portfolioCanvas || !portfolioScene || !portfolioCamera) return;
    
    const rect = portfolioCanvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycaster.setFromCamera(mouse, portfolioCamera);
    const intersects = raycaster.intersectObjects(portfolioScene.children, true);

    let obj;
    let validClick = false;
    
    if (intersects.length > 0) {
        obj = intersects[0].object;
        
        // First check for certificate screen
        let screenObj = obj;
        while (screenObj && !screenObj.name.includes("certificateScreen") && screenObj.parent) {
            screenObj = screenObj.parent;
        }



        if (screenObj && screenObj.name === "certificateScreen") {
            validClick = true;
            const currentTime = Date.now();
            
            // Double-click detection (300ms threshold)
            if (currentTime - lastClickTime < 300) {
                if (screenObj.userData.isActive) {
                    screenObj.userData.toggle();
                }
                lastClickTime = 0;
                return;
            }
            
            lastClickTime = currentTime;
            
            if (!screenObj.userData.isActive && certificatesLoaded) {
                startCertificateAnimation(screenObj);
                screenObj.userData.isActive = true;
            }
        }

        // Rest of the object handling code...
        let foundKey = null;
        while (obj) {
            foundKey = Object.keys(objectInfoMap).find(key => 
                obj.name.toLowerCase().includes(key)
            );
            if (foundKey) break;
            obj = obj.parent;
        }

       
        if (foundKey) {
            validClick = true;
            // Store original scale and animate with relative values
            const originalScale = {
                x: obj.scale.x,
                y: obj.scale.y,
                z: obj.scale.z
            };


            // Animate with 20% scale increase
            gsap.to(obj.scale, {
                x: originalScale.x * 1.2,
                y: originalScale.y * 1.2,
                z: originalScale.z * 1.2,
                duration: 0.3,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut",
                onComplete: () => {
                    // Reset to exact original scale after animation
                    obj.scale.set(originalScale.x, originalScale.y, originalScale.z);
                }
            });
            
            // Show object info
            showObjectInfo(objectInfoMap[foundKey], intersects[0].point, true);
        }

                // Play sound only for valid clicks
                if (validClick && clickSound) {
                    clickSound.currentTime = 0;
                    clickSound.play().catch(e => console.error('Click sound error:', e));
                }
        
    } else {
        hideObjectInfo();
    }
}


function showObjectInfo(info, position,  isClick = false) {
    const infoDiv = document.querySelector('.object-info');
    const rect = infoDiv.getBoundingClientRect();
    
    // Create close button with proper event binding
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.addEventListener('click', () => {
        isInfoFromClick = false;
        hideObjectInfo();
    });

  
            infoDiv.innerHTML = `
            <h3>${info.title}</h3>
            <div class="info-content">${info.content}</div>
        `;

        // Add link behavior
        const links = infoDiv.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(link.href, '_blank');
            });
        });

    infoDiv.appendChild(closeBtn);

     // Get screen position of the object
     const vector = position.clone().project(portfolioCamera);
     const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
     const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
 
     // Determine best position
     const margin = 20;
     const infoWidth = infoDiv.offsetWidth;
     const infoHeight = infoDiv.offsetHeight;
     
     // Reset positioning classes
     infoDiv.classList.remove('bottom');
     
     // Check vertical placement
     if (y < window.innerHeight / 2) {
         // Place below if in top half
         infoDiv.style.top = `${y + margin}px`;
         infoDiv.classList.add('bottom');
     } else {
         // Place above if in bottom half
         infoDiv.style.top = `${y - infoHeight - margin}px`;
     }
 
     // Horizontal positioning
     const leftPosition = Math.max(margin, x - infoWidth / 2);
     const rightEdge = window.innerWidth - infoWidth - margin;
     infoDiv.style.left = `${Math.min(leftPosition, rightEdge)}px`;
 
     // Update arrow position
     const arrowOffset = x - parseFloat(infoDiv.style.left);
     infoDiv.style.setProperty('--arrow-offset', `${arrowOffset}px`);



    infoDiv.classList.add('visible');

    infoDiv.style.animation = 'float 3s ease-in-out infinite';

    setTimeout(hideObjectInfo, 100000);


    if (isClick) {
        isInfoFromClick = true;
        if (clickInfoTimeout) clearTimeout(clickInfoTimeout);
        clickInfoTimeout = setTimeout(() => {
            hideObjectInfo();
            isInfoFromClick = false;
        }, 100000); // 10 seconds
    }
}

function hideObjectInfo() {
    const infoDiv = document.querySelector('.object-info');
    infoDiv.classList.remove('visible');
    isInfoFromClick = false;
    if (clickInfoTimeout) {
        clearTimeout(clickInfoTimeout);
        clickInfoTimeout = null;
    }


      // Remove existing close button
      const closeBtn = infoDiv.querySelector('.close-btn');
      if (closeBtn) {
          closeBtn.removeEventListener('click', hideObjectInfo);
          closeBtn.remove();
      }
}


let lastClickTime = 0;
 // Certificate animation
 function startCertificateAnimation(screen) {
    if (!certificatesLoaded) return;
    const screenMaterial = screen.material;
    
    // Activate screen
    screenMaterial.color.set(0xffffff);
    screenMaterial.needsUpdate = true;

    let currentCertIndex = 0;
    screenMaterial.map = certificateTextures[currentCertIndex];
    screenMaterial.needsUpdate = true;

    certificateAnimationInterval = setInterval(() => {
        currentCertIndex = (currentCertIndex + 1) % certificateTextures.length;
        screenMaterial.map = certificateTextures[currentCertIndex];
        screenMaterial.needsUpdate = true;
        
        gsap.to(screenMaterial, {
            emissiveIntensity: 1.2,
            duration: 0.5,
            yoyo: true,
            repeat: 1
        });
    }, 2000);

    // Add toggle functionality
    screen.userData.toggle = () => {
        clearInterval(certificateAnimationInterval);
        screenMaterial.map = null;
        screenMaterial.color.set(0x000000);
        screenMaterial.emissive.set(0x000000);
        screenMaterial.emissiveIntensity = 0;
        screenMaterial.needsUpdate = true;
        screen.userData.isActive = false;
    };
}


const roomWidth = 800;
const roomHeight = 400;
const roomDepth = 800;
function loadPortfolioRoom() {
    const loader = new GLTFLoader(portfolioLoadingManager);
    const textureLoader = new THREE.TextureLoader(portfolioLoadingManager);
   
    

    // ======================
    // Realistic Wall Setup
    // ======================
    const wallTexture = textureLoader.load('textures/solid blue-texture.jpg');
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.7,
        metalness: 0.2,
        side: THREE.BackSide
    });

    // Create the room as a box
    const roomGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
    const room = new THREE.Mesh(roomGeometry, wallMaterial);
    portfolioScene.add(room);

    // ======================
    // Floor Setup
    // ======================
    const floorTexture = textureLoader.load('textures/solid brown-texture.jpg');
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.3,
        metalness: 0.4
    });

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomWidth, roomDepth),
        floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -roomHeight / 2.1;
    floor.receiveShadow = true;
    portfolioScene.add(floor);

    // ======================
    // Enhanced Lighting
    // ======================
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    portfolioScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    portfolioScene.add(directionalLight);

    // ======================
    // Realistic Props
    // ======================
    // Bookshelf
    loader.load('models/bookshelf1.glb', (gltf) => {
        const shelf = gltf.scene;
        shelf.name = "bookshelf";
        shelf.position.set(-roomWidth / 2 + 750, -roomHeight / 2 + 20, -roomDepth / 2 + 300);
        shelf.scale.set(120, 120, 120);
        shelf.rotation.y = -Math.PI / 2;
        shelf.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        portfolioScene.add(shelf);
    });

    // Desk
    loader.load('models/computer_desk.glb', (gltf) => {
        const desk = gltf.scene;
        desk.name = "desk";
        desk.position.set(300, -roomHeight / 2 + 19, roomDepth / 2 - 150);
        desk.scale.set(27, 29, 27);
        desk.rotation.y = Math.PI;
        desk.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        portfolioScene.add(desk);
    });

    loader.load('models/stand1.glb', (gltf) => {
        const stand = gltf.scene;
        stand.position.set(-roomWidth / 2 + 400, -roomHeight / 2 + 15, -roomDepth / 2 + 50);
        stand.scale.set(300, 200, 300);
        stand.rotation.y = Math.PI;
        stand.traverse((child) => {
        if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        portfolioScene.add(stand);
    });


    loader.load('models/chamber.glb', (gltf) => {
        const chamber = gltf.scene;
        chamber.name = "chamber";
        chamber.position.set(-540, -roomHeight/2 + 20, roomDepth/2 + 150);
        chamber.scale.set(0.4, 0.4, 0.4);
        chamber.rotation.y = Math.PI / 2;

        portfolioScene.add(chamber);
    });
 

    loader.load('models/lamp.glb', (gltf) => {
        const lamp = gltf.scene;
        lamp.position.set(-roomWidth / 2 + 750, -roomHeight / 2 + 20, -roomDepth / 2 + 90);
        lamp.scale.set(2, 2, 2);
        lamp.rotation.y = -Math.PI / 2;
        lamp.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        portfolioScene.add(lamp);
    });


    
    loader.load('models/hat.glb', (gltf) => {
        const cap = gltf.scene;
        cap.name = "cap";
        cap.position.set(-roomWidth / 2 + 300, -roomHeight / 2 + 185, -roomDepth / 2 + 50);
        cap.scale.set(42, 42, 42);
        cap.rotation.y = -Math.PI / 2;
        cap.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        portfolioScene.add(cap);
    });


    const socialPositions = [
        {
            name: 'linkedin',
            path: 'models/linkedin1.glb',
            position: [-35, -roomHeight/2 + 270, -roomDepth/2 + 790],
            scale: [61, 61, 61],
            rotation: [0, Math.PI, 0]
        },
        {
            name: 'github',
            path: 'models/github1.glb',
            position: [120, -roomHeight/2 + 295, -roomDepth/2 + 790],
            scale: [20, 20, 20],
            rotation: [0, Math.PI, 0]
        }
    ];

    socialPositions.forEach(config => {
        loader.load(config.path, (gltf) => {
            const model = gltf.scene;
            model.name = config.name;
            model.position.set(...config.position);
            model.scale.set(...config.scale);
            model.rotation.set(...config.rotation);

            portfolioScene.add(model);
        });
    });



    // Glowing objects setup
    const objectsToLoad = [
        { 
            name: 'trophy', 
            path: 'models/trophy.glb', 
            info: 'Hackathon Winner 2023',
            position: [-roomWidth / 2 + 500, -roomHeight / 2 + 182, -roomDepth / 2 + 50],
            rotation: [0, Math.PI / 2, 0],
            scale: [32, 34, 32]
        },
        { 
            name: 'robot', 
            path: 'models/eve3.glb', 
            info: 'AI Projects Collection',
            position: [-140, -roomHeight / 2 - 100, roomDepth / 2 - 170],
            rotation: [0, Math.PI / 6, 0],
            scale: [30, 30, 30]
        }
    ];
    objectsToLoad.forEach((obj) => {
        loader.load(obj.path, (gltf) => {
            const object = gltf.scene;
            object.name = obj.name; // Crucial for object recognition
            object.userData.originalY = obj.position[1];
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: child.material.color,
                        roughness: 0.4,
                        metalness: 0.2,
                        normalMap: child.material.normalMap
                    });
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Position objects near the desk
            if (obj.name === 'trophy') {
                object.userData.info = obj.info; // Store additional data
                object.position.set(-roomWidth / 2 + 500, -roomHeight / 2 + 182, -roomDepth / 2 + 50);
                object.rotation.y = Math.PI / 2;
                object.scale.set(32, 34, 32);
            }
             portfolioScene.add(object);
             if (obj.name === 'robot') {
                const eve = gltf.scene;
                eve.name = "robot";
                eve.position.set(0, -roomHeight / 2 - 100, roomDepth / 2 - 320);
                eve.scale.set(30, 30, 30);
                eve.rotation.y = Math.PI / 6;
            
                // Add floating animation
                const originalY = eve.position.y;
                let floatTime = 0;
                
                // Add lights to the robot
                const eyeLight = new THREE.PointLight(0x00ffff, 50, 100);
                eyeLight.castShadow = true;
                
                const bodyLight = new THREE.PointLight(0xffaa00, 30, 50);
                bodyLight.castShadow = true;
            
                eve.traverse(child => {
                    if (child.name === 'Eye') {
                        child.add(eyeLight);
                        eyeLight.position.set(0, 0, 1);
                    }
                    if (child.name === 'Body') {
                        child.add(bodyLight);
                        bodyLight.position.set(0, 0.5, 0);
                    }
                });
            
                // Add introduction sequence
                setTimeout(() => {
                    const infoBox = document.querySelector('.info-box');
                    infoBox.style.display = 'block';
                    
                    const handleIntroKey = (e) => {
                        if (e.key === 'Enter') {
                            infoBox.style.display = 'none';
                            
                            // Move Eve to target position
                            gsap.to(eve.position, {
                                x: -140,
                                y: -roomHeight / 2 - 100,
                                z: roomDepth / 2 - 170,
                                duration: 5,
                                ease: "power2.inOut",
                                onUpdate: () => {
                                    // Calculate rotation during movement
                                    const angle = Math.atan2(
                                        0, -roomHeight / 2 - 100, roomDepth / 2 - 320
                                    );
                                    eve.rotation.y = Math.PI/6;
                                }
                            });
            
                            window.removeEventListener('keydown', handleIntroKey);
                        }
                    };
                    window.addEventListener('keydown', handleIntroKey);
                }, 7000);
            
                // Add to floating objects array
                floatingObjects.push({
                    object: eve,
                    originalY: originalY,
                    time: 0,
                    lights: [eyeLight, bodyLight]
                });
            
                eve.userData.info = obj.info;
                portfolioScene.add(eve);
            }
        });
    });


        
       

        // Add certificate display screen
    const certificateUrls = [
        'certificates/cert1.jpg',
        'certificates/cert2.jpg',
        'certificates/cert3.jpg'
    ];

    // Screen setup
    const screenGeometry = new THREE.PlaneGeometry(310, 220);
    const screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000, // Dark gray blank screen
        side: THREE.DoubleSide,
        emissive: 0x000000,
        emissiveIntensity: 0
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);

    screen.name = "certificateScreen";
    screen.userData.isActive = false;

    // Position screen to the left of the desk
    screen.position.set(-390, -roomHeight/2 + 250, roomDepth/2 - 500);
    screen.rotation.y = Math.PI/2; // Rotate to face the room
    portfolioScene.add(screen);

    // Add screen frame
    const frameGeometry = new THREE.BoxGeometry(350, 244, 2);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(-392, -roomHeight/2 + 250, roomDepth/2 - 500);
    frame.rotation.y = Math.PI/2; // Rotate to face the room
    portfolioScene.add(frame);


    
    
    const portfolioTextureLoader = new THREE.TextureLoader(); // Separate loader for portfolio

    // Load certificates and create array of textures
    // let loadedTextures = 0;
    certificateUrls.forEach(url => {
        portfolioTextureLoader.load(url, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Maximizing anisotropy
            texture.generateMipmaps = true; // Enables mipmapping
            texture.minFilter = THREE.LinearMipMapLinearFilter; // High-quality filtering
            texture.magFilter = THREE.LinearFilter; // Prevents pixelation
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
    
            certificateTextures.push(texture);
        if (certificateTextures.length === certificateUrls.length) {
            certificatesLoaded = true;
        }
        });
    });

  
   
    window.addEventListener('resize', () => {
        portfolioCamera.aspect = window.innerWidth / window.innerHeight;
        portfolioCamera.updateProjectionMatrix();
        portfolioRenderer.setSize(window.innerWidth, window.innerHeight);

        if (portfolioLoadingContainer) {
            const rect = portfolioLoadingContainer.getBoundingClientRect();
            portfolioLoadingContainer.style.left = `${window.innerWidth/2 - rect.width/2}px`;
            portfolioLoadingContainer.style.top = `${window.innerHeight/2 - rect.height/2}px`;
        }
    });


}




function animatePortfolioScene() {
    requestAnimationFrame(animatePortfolioScene);



    if (!isOverInfoBox && isDragging) {
        portfolioControls.update();
      }

    floatingObjects.forEach(obj => {
        obj.time += 0.02;
        // Floating animation
        obj.object.position.y = obj.originalY + Math.sin(obj.time) * 12;
        
        // Animate lights
        obj.lights.forEach(light => {
            light.intensity = 30 + Math.sin(obj.time * 2) * 15;
        });
    });

    portfolioRenderer.render(portfolioScene, portfolioCamera);

}



// Add cleanup function
function cleanupOriginalScene() {
    // Remove event listeners
    window.removeEventListener('resize', positionTVText);
    window.removeEventListener('keydown', handleTeleportKey);
    
    // Dispose Three.js resources
    renderer.dispose();
    scene.traverse(object => {
        if (object.isMesh) {
            object.geometry.dispose();
            object.material.dispose();
        }
    });

    
    function returnToMainScene() {
        // Stop portfolio animation
        cancelAnimationFrame(portfolioAnimationFrame);
        if (portfolioLoadingContainer) portfolioLoadingContainer.remove();
        if (instructionText) instructionText.remove();
        
        // Cleanup portfolio scene
        portfolioScene.traverse(child => {
            if(child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
        
        
        // Hide portfolio canvas
        portfolioCanvas = document.querySelector('.webgl-portfolio');
        portfolioCanvas.removeEventListener('mousemove', onPortfolioMouseMove);
        portfolioCanvas.removeEventListener('click', onPortfolioClick);
        portfolioCanvas.style.display = 'none';
        
        // Show main canvas
        const mainCanvas = document.querySelector('.webgl');
        mainCanvas.style.display = 'block';
        
        // Reset main camera
        camera.position.set(-300, 15, 30);
        controls.update();

        portfolioCanvas = null;


        if (certificateAnimationInterval) {
            clearInterval(certificateAnimationInterval);
        }
        
        const screen = portfolioScene.getObjectByName("certificateScreen");
        if (screen) {
            screen.material.dispose();
        }
    
        
    }

}


// Add camera states
const CAMERA_STATES = {
    START: 0,
    FOLLOWING: 1,
    SITTING: 2
};
let cameraState = CAMERA_STATES.START;
let cameraTarget = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(-30, 5, 5); // Offset for following camera

// Initialize camera to top view
function setTopView() {
    camera.position.set(-400, 200, 150);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}
setTopView(); // Set initial view




// ==========================
// GUI Controls
// ==========================
// const gui = new GUI();

// // TV Controls
// const tvControls = {
//     playTV: () => video.play(),
//     pauseTV: () => video.pause(),
//     muteTV: () => video.muted = true,
// };

// const tvFolder = gui.addFolder("📺 TV Controls");
// tvFolder.add(tvControls, "playTV").name("▶ Play TV");
// tvFolder.add(tvControls, "pauseTV").name("⏸ Pause TV");
// tvFolder.open();



let fanRotation = true; // Fan always rotating
let isAnimating = false;
let scrollProgress = 0;
const maxScrollSteps = 100;




window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && !isAnimating) {

        if (clickSound) {
            clickSound.currentTime = 0; // Reset sound to start
            clickSound.play().catch(e => console.error('Click sound play failed:', e));
        }

        setTimeout(() => {
            if (teleportSound) {
                teleportSound.currentTime = 0;
                teleportSound.play().catch(e => console.error('Teleport sound error:', e));
            }
        }, 1880);


        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
        }

        document.querySelector('.system-message').style.display = 'none';
        startManAnimation();
        isAnimating = true;
        
        if (cameraState === CAMERA_STATES.START) {
            cameraState = CAMERA_STATES.FOLLOWING;
            controls.enabled = false;
        }
    }
});

function startManAnimation() {
    if (!walking && !sitting) {
        walking = true;
        currentTargetIndex = 0;
        if (walkAction) walkAction.play();
    }
}



// Resize Event
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    portalMaterial.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
});



// ==========================
// Animation Loop
// ==========================
const clock = new THREE.Clock(); 

function animate() {
    requestAnimationFrame(animate);

     // Always rotate fan
     if (fanModel) {
        fanModel.rotation.y += 0.06;
    }



  const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    
    // Handle camera states
    switch(cameraState) {
        case CAMERA_STATES.START:
            // Maintain top view until scrolling starts
            break;
            
        case CAMERA_STATES.FOLLOWING:
            if (man) {
                // Smooth follow with offset
                const targetPosition = new THREE.Vector3().copy(man.position).add(new THREE.Vector3(-55, 15, 5));
                camera.position.lerp(targetPosition, 0.1);
                controls.target.lerp(man.position, 0.1);
            }
            break;
            
        case CAMERA_STATES.SITTING:
            // Camera focuses on TV
            const tvPosition = new THREE.Vector3(0, 19, -69.8);
            const cameraPosition = new THREE.Vector3(0, 5, 49);
            
            camera.position.lerp(cameraPosition, 0.1);
            controls.target.lerp(tvPosition, 0.1);
            break;
    }


   // In animate() function
if (man && walking) {
    const currentTarget = path[currentTargetIndex];
    const direction = new THREE.Vector3().subVectors(currentTarget, man.position).normalize();
    
    // Update position and rotation
    man.position.add(direction.multiplyScalar(moveSpeed));
    const targetRotation = Math.atan2(direction.x, direction.z);
    man.rotation.y = THREE.MathUtils.lerp(man.rotation.y, targetRotation, 0.1);
  
    // Check if reached current target
    if (man.position.distanceTo(currentTarget) < 1.0) {
      currentTargetIndex++;
      
      if (currentTargetIndex >= path.length) {
        walking = false;
        walkAction.stop();
        
        // Trigger sitting animation
        sitting = true;
        sitAction.reset().play();
        man.position.set(0, -10.2, 14.5);
        man.rotation.y = Math.PI;

         // Switch to sitting camera
         cameraState = CAMERA_STATES.SITTING;
      }
    }
  }
  
  if (teleportSphere) {
    teleportShaderMaterial.uniforms.time.value += 0.01;
    }
    controls.update();
    portalMaterial.uniforms.time.value += 0.01;
    portalMesh.rotation.z += 0.005; // Subtle portal rotation for added effect
    portalMesh.scale.x = 11 + Math.sin(portalMaterial.uniforms.time.value) * 0.2; // Pulsating scale effect
    portalMesh.scale.y = 11 + Math.sin(portalMaterial.uniforms.time.value) * 0.2;

    renderer.render(scene, camera);

}

animate();
