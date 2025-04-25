import * as THREE from 'three'; // imports three.js renderer for robot scene
import { GLTFLoader } from 'GLTFLoader';
import { RGBELoader } from 'RGBELoader'; // imports rgb loader for my robots textures and hdr file to work properly

const scene = new THREE.Scene();  // sets the variables from the three.js framework for simplicity
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2003);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);  // uses three.js renderer settings
document.body.appendChild(renderer.domElement);
renderer.domElement.style.display = 'flex'; // sets the 3D scenes dimensions and bg colors
renderer.domElement.style.width = '55vw';
renderer.domElement.style.height = 'clamp(70%, 50vw, 85%)';
renderer.domElement.style.top = '17rem';
renderer.domElement.style.right = '20%';
renderer.setClearColor(new THREE.Color('#09090a'), 0);
renderer.domElement.id = 'myCanvas'; // ID the renderer scene .domElement in order to target with css


const light = new THREE.AmbientLight(0xd3813c, 3); //adds ambient light to my scene, I set it to a slight amber color
scene.add(light);

const directLight = new THREE.DirectionalLight(0xffffff, 5); // adds direct light with intensity adjustments
scene.add(directLight);

directLight.intensity = 5;

renderer.toneMapping = THREE.LinearToneMapping; //sets the tone mapping renderer, I chose linear but theres other options
renderer.toneMappingExposure = .26; // exposure settings for my robot

camera.position.x = 0; // 3d scene camera positions on x,y,z axis
camera.position.y = 0;
camera.position.z = 5.5;

const pmremGenerator = new THREE.PMREMGenerator(renderer); // this is the newest three.js renderer and the
pmremGenerator.compileEquirectangularShader(); // one making my robot in HD

new RGBELoader() // rgb loader using my hdr file for the robot
  .setDataType(THREE.FloatType)
  .setPath('./')
  .load('javascript/footprint-court.hdr', (hdrEquirectangular) => {
    const envMap = pmremGenerator.fromEquirectangular(hdrEquirectangular).texture;
    scene.environment = envMap;
    hdrEquirectangular.dispose();
    pmremGenerator.dispose();
  });

particlesJS.load('particles-js', 'javascript/particles.json', function() { // particle.js loader (stars in background)
  console.log('Particles.js loaded!');
});

const clock = new THREE.Clock();
let mixer;

const loader = new GLTFLoader(); // gltf file loader, since my robot file is in glt format
loader.load(
  'javascript/robot.glb',
  (gltf) => {
    const robot = gltf.scene;

    function updateRobotScale() {  // I had to add this javascript code in order to get my robot to scale according to
      const screenWidth = window.innerWidth; // screen size since theres no way of doing it with css, works like clamp()

       const baseScale = screenWidth / 1440;
       robot.scale.set(baseScale * 0.08, baseScale && 0.05, baseScale * 0.05); // straight forward * the set scale
    }                                                                          // according to screen size

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
      console.log('Animation started!'); // console logs for debugging
    }
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded'); // console logs robot load percentages for debugging
  },
  (error) => {
    console.error('An error occurred:', error);
  }
);

function animate() {  // runs animation loaded into gltf file using blender
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
}
animate(); // starts animation

const synth = window.speechSynthesis;

function speak() { // robot greeting voice set with a delay to match his waving animation
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

renderer.setPixelRatio(window.devicePixelRatio); // this was a poor attempt at getting my robot to render properly lol
renderer.shadowMap.enabled = true; // doubt its doing anything at this point, The magic was done with the rgb loader



