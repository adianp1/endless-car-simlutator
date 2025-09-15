import * as THREE from 'three';

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa0c8ff, 0.002);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xa0c8ff);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(-100, 100, -100);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
scene.add(dirLight);

// Ground (Grass)
const groundGeo = new THREE.PlaneGeometry(200, 1000);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x228822 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -200;
ground.receiveShadow = true;
scene.add(ground);

// Road Parameters
const roadWidth = 10;
const segmentLength = 100;
const laneMarkWidth = 0.2;
const laneMarkLength = 4;
const laneMarkGap = 6;

// Road Segments Array
const roadSegments = [];

function createRoadSegment(zPos) {
  const segmentGroup = new THREE.Group();

  // Road base
  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = zPos;
  road.receiveShadow = true;
  segmentGroup.add(road);

  // Lane markings - center dashed line
  const markingsGroup = new THREE.Group();
  const laneMarkGeo = new THREE.PlaneGeometry(laneMarkWidth, laneMarkLength);
  const laneMarkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff });

  let z = zPos - segmentLength / 2 + laneMarkLength / 2;
  while (z < zPos + segmentLength / 2) {
    const mark = new THREE.Mesh(laneMarkGeo, laneMarkMat);
    mark.position.set(0, 0.01, z);
    mark.rotation.x = -Math.PI / 2;
    markingsGroup.add(mark);
    z += laneMarkLength + laneMarkGap;
  }
  segmentGroup.add(markingsGroup);

  return { road: road, markings: markingsGroup, group: segmentGroup };
}

// Create multiple road segments for endless effect
for (let i = 0; i < 10; i++) {
  const seg = createRoadSegment(-i * segmentLength);
  scene.add(seg.group);
  roadSegments.push(seg);
}

// Mountains (Background)
// Create simple low-poly mountain shapes
const mountains = [];
const mountainCount = 5;
const mountainColors = [0x555555, 0x444444, 0x666666];

for (let i = 0; i < mountainCount; i++) {
  const geometry = new THREE.ConeGeometry(12 + Math.random() * 10, 30 + Math.random() * 20, 4);
  const material = new THREE.MeshStandardMaterial({ color: mountainColors[i % mountainColors.length], flatShading: true });
  const mountain = new THREE.Mesh(geometry, material);
  mountain.position.set((i - 2) * 25, 15, -60); // Initial position behind camera; updated in animate()
  mountain.castShadow = true;
  scene.add(mountain);
  mountains.push(mountain);
}

// Car Model
const car = new THREE.Group();

// Main car body
const bodyGeo = new THREE.BoxGeometry(3, 1, 5);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0044cc, metalness: 0.6, roughness: 0.3 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 0.5;
body.castShadow = true;
car.add(body);

// Roof (slightly sloped)
const roofGeo = new THREE.BoxGeometry(2.5, 0.7, 2);
const roofMat = new THREE.MeshStandardMaterial({ color: 0x003399, metalness: 0.5, roughness: 0.2 });
const roof = new THREE.Mesh(roofGeo, roofMat);
roof.position.set(0, 1.15, -0.3);
roof.castShadow = true;
car.add(roof);

// Windows (semi-transparent)
const windowGeo = new THREE.BoxGeometry(2.4, 0.5, 1.5);
const windowMat = new THREE.MeshStandardMaterial({ color: 0x99ccff, transparent: true, opacity: 0.6, metalness: 0.3, roughness: 0.1 });
const windows = new THREE.Mesh(windowGeo, windowMat);
windows.position.set(0, 1.3, -0.3);
windows.castShadow = false;
car.add(windows);

// Wheels
function createWheel() {
  const wheelGroup = new THREE.Group();

  const tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.9 });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rimGeo = new THREE.CircleGeometry(0.3, 16);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1, roughness: 0.2 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.y = Math.PI / 2;
  rim.position.z = 0.2;
  tire.add(rim);

  return wheelGroup;
}

const wheelPositions = [
  [-1.1, 0.25, 1.6],
  [1.1, 0.25, 1.6],
  [-1.1, 0.25, -1.6],
  [1.1, 0.25, -1.6]
];

wheelPositions.forEach(pos => {
  const wheel = createWheel();
  wheel.position.set(...pos);
  car.add(wheel);
});

// Add bumpers and lights to car for more realism
function enhanceCarModel(car) {
  // Front bumper
  const bumperGeo = new THREE.BoxGeometry(2.6, 0.3, 0.3);
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 });
  const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
  frontBumper.position.set(0, 0.25, 2.5);
  frontBumper.castShadow = true;
  car.add(frontBumper);

  // Rear bumper
  const rearBumper = frontBumper.clone();
  rearBumper.position.set(0, 0.25, -2.5);
  car.add(rearBumper);

  // Headlights (emissive)
  const headlightGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 1 });
  const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
  leftHeadlight.position.set(-0.7, 0.6, 2.7);
  car.add(leftHeadlight);

  const rightHeadlight = leftHeadlight.clone();
  rightHeadlight.position.x = 0.7;
  car.add(rightHeadlight);

  // Taillights (red emissive)
  const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.7 });
  const leftTaillight = new THREE.Mesh(headlightGeo, taillightMat);
  leftTaillight.position.set(-0.7, 0.6, -2.7);
  car.add(leftTaillight);

  const rightTaillight = leftTaillight.clone();
  rightTaillight.position.x = 0.7;
  car.add(rightTaillight);
}
enhanceCarModel(car);

car.position.set(0, 0.35, 0);
car.castShadow = true;
scene.add(car);

// Movement Controls
let moveForward = false;
let moveBackward = false;
let turnLeft = false;
let turnRight = false;

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowUp': moveForward = true; break;
    case 'ArrowDown': moveBackward = true; break;
    case 'ArrowLeft': turnLeft = true; break;
    case 'ArrowRight': turnRight = true; break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowUp': moveForward = false; break;
    case 'ArrowDown': moveBackward = false; break;
    case 'ArrowLeft': turnLeft = false; break;
    case 'ArrowRight': turnRight = false; break;
  }
});

// Speed and steering parameters
let speed = 0;
const maxSpeed = 2.5; // approx 200 mph top speed
const acceleration = 0.02;
const deceleration = 0.01;
const steeringAngle = 0.03;

// Speedometer
const speedometer = document.createElement('div');
speedometer.style.position = 'absolute';
speedometer.style.top = '10px';
speedometer.style.left = '10px';
speedometer.style.color = '#fff';
speedometer.style.fontFamily = 'Arial, sans-serif';
speedometer.style.fontSize = '18px';
speedometer.style.backgroundColor = 'rgba(0,0,0,0.4)';
speedometer.style.padding = '6px 12px';
speedometer.style.borderRadius = '8px';
speedometer.style.userSelect = 'none';
document.body.appendChild(speedometer);

// Boundaries and collision detection
const roadBoundary = roadWidth / 2 + 1; // 1 unit margin off road edges
const resetPosition = new THREE.Vector3(0, 0.35, 0);
const resetRotation = 0;

// Mountain bounding boxes for collision
const mountainBoxes = mountains.map(mtn => new THREE.Box3().setFromObject(mtn));

// Reset car position and speed
function resetCar() {
  car.position.copy(resetPosition);
  car.rotation.set(0, resetRotation, 0);
  speed = 0;
}

// Check boundaries and collisions
function checkCarStatus() {
  // Road edges
  if (Math.abs(car.position.x) > roadBoundary) {
    resetCar();
  }

  // Mountain collision
  const carBox = new THREE.Box3().setFromObject(car);
  for (const mBox of mountainBoxes) {
    if (carBox.intersectsBox(mBox)) {
      resetCar();
      break;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Speed control
  if (moveForward) speed += acceleration;
  else if (moveBackward) speed -= acceleration;
  else {
    if (speed > 0) speed -= deceleration;
    else if (speed < 0) speed += deceleration;
  }
  speed = Math.min(maxSpeed, Math.max(-maxSpeed / 2, speed));

  // Steering only if moving
  if (speed !== 0) {
    if (turnLeft) car.rotation.y += steeringAngle * (speed / maxSpeed);
    if (turnRight) car.rotation.y -= steeringAngle * (speed / maxSpeed);
  }

  // Move car forward
  const forwardVector = new THREE.Vector3(0, 0, -1);
  forwardVector.applyEuler(car.rotation);
  forwardVector.multiplyScalar(speed);
  car.position.add(forwardVector);

  // Check collisions and boundaries
  checkCarStatus();

  // Camera follow
  const camOffset = new THREE.Vector3(0, 6, 12);
  camOffset.applyEuler(car.rotation);
  const desiredCamPos = car.position.clone().add(camOffset);
  camera.position.lerp(desiredCamPos, 0.1);
  camera.lookAt(car.position);

  // Mountains always visible behind camera
  mountains.forEach(mtn => {
    mtn.position.x = camera.position.x;
    mtn.position.y = 0;
    mtn.position.z = camera.position.z - 60;
  });

  // Endless road recycling
  const firstSegment = roadSegments[0].road;
  if (car.position.z < firstSegment.position.z - segmentLength) {
    const lastSegment = roadSegments[roadSegments.length - 1].road;
    roadSegments[0].road.position.z = lastSegment.position.z - segmentLength;
    roadSegments[0].markings.position.z = lastSegment.position.z - segmentLength;
    roadSegments.push(roadSegments.shift());
  }

  // Update speedometer (mph)
  speedometer.textContent = `Speed: ${Math.abs((speed * 80).toFixed(0))} mph`;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
