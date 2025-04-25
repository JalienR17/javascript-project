import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { RGBELoader } from 'RGBELoader';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2003);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.display = 'flex';
renderer.domElement.style.width = '55vw';
renderer.domElement.style.height = 'clamp(70%, 50vw, 85%)';
renderer.domElement.style.top = '17rem';
renderer.domElement.style.right = '20%';
renderer.setClearColor(new THREE.Color('#09090a'), 0);
renderer.domElement.id = 'myCanvas';

const light = new THREE.AmbientLight(0xd3813c, 3);
scene.add(light);
const directLight = new THREE.DirectionalLight(0xffffff, 5);
scene.add(directLight);
directLight.intensity = 5;

renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 0.26;

camera.position.set(0, 0, 5.5);

// Create and use the custom loading manager
const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (item, loaded, total) => {
  console.log(`Loading ${item}: ${loaded}/${total}`);
  const progress = Math.round((loaded / total) * 100);
  document.getElementById('loading-text').innerText = `${progress}%`;
  document.getElementById('progress-bar').style.width = `${progress}%`;
};
loadingManager.onLoad = () => {
  console.log('All assets loaded');
  document.getElementById('loading-screen').style.display = 'none';
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Pass the custom loadingManager to RGBELoader
new RGBELoader(loadingManager)
  .setDataType(THREE.FloatType)
  .setPath('./')
  .load('javascript/footprint-court.hdr', (hdrEquirectangular) => {
    const envMap = pmremGenerator.fromEquirectangular(hdrEquirectangular).texture;
    scene.environment = envMap;
    hdrEquirectangular.dispose();
    pmremGenerator.dispose();
  });

// Particle.js loader remains the same if it doesn't integrate with THREE.LoadingManager
particlesJS.load('particles-js', 'javascript/particles.json', function() {
  console.log('Particles.js loaded!');
});

const clock = new THREE.Clock();
let mixer;

// Pass the custom loadingManager to GLTFLoader as well
const loader = new GLTFLoader(loadingManager);
loader.load(
  'javascript/robot.glb',
  (gltf) => {
    const robot = gltf.scene;

    function updateRobotScale() {
      const screenWidth = window.innerWidth;
      const baseScale = screenWidth / 1440;
      robot.scale.set(baseScale * 0.08, baseScale && 0.05, baseScale * 0.05);
    }

    updateRobotScale();
    robot.position.set(0, -2.3, 0);
    scene.add(robot);
    console.log('Robot loaded successfully!');

    window.addEventListener('resize', updateRobotScale);

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(robot);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
      });
      console.log('Animation started!');
    }
  },
  (xhr) => {
    // This onProgress is optional now that the manager handles progress,
    // but you can leave this here for additional debugging.
    console.log(Math.round((xhr.loaded / xhr.total) * 100) + '% loaded');
  },
  (error) => {
    console.error('An error occurred:', error);
  }
);

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}
animate();

const synth = window.speechSynthesis;
function speak() {
  const utterance = new SpeechSynthesisUtterance(
    'Welcome to our NASA-themed website. Enjoy exploring our awesome robot and stars!'
  );
  utterance.voice = synth.getVoices().find(voice => voice.name.includes('male'));
  synth.speak(utterance);
}
function delayedSpeak() {
  setTimeout(speak, 10500);
}
if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = delayedSpeak;
} else {
  delayedSpeak();
}

renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;