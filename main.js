// Main.js - Improved Endless Car Simulator

// --- THREE.js setup ---
const scene = new THREE.Scene();

// Gradient sky background using fog and color
scene.fog = new THREE.FogExp2(0x87ceeb, 0.001); // light sky blue

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// --- Ground (Grass) ---
const groundGeo = new THREE.PlaneGeometry(500, 500);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// --- Mountains (decorative, unreachable) ---
function createMountain(x, z, height, width) {
  const geo = new THREE.ConeGeometry(width, height, 4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8B7D7B, flatShading: true });
  const mountain = new THREE.Mesh(geo, mat);
  mountain.position.set(x, height / 2, z);
  mountain.rotation.y = Math.PI / 4; // diamond shape
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  scene.add(mountain);
  return mountain;
}

const mountains = [];
const mountainPositions = [-150, -100, -50, 0, 50, 100, 150];
for (let x of mountainPositions) {
  const height = 20 + Math.random() * 10;
  const width = 20 + Math.random() * 10;
  mountains.push(createMountain(x, -200, height, width)); // far back
}

// --- Road Parameters ---
const laneCount = 3;
const laneWidth = 3.5;
const roadWidth = laneCount * laneWidth;
const segmentLength = 60;
const numSegments = 8;

let roadSegments = [];

// Create road segment
function createRoadSegment(zPos) {
  const group = new THREE.Group();

  // Road surface
  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  group.add(road);

  // Shoulders
  const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const shoulderGeo = new THREE.PlaneGeometry(0.2, segmentLength);

  const left = new THREE.Mesh(shoulderGeo, shoulderMat);
  left.position.set(-roadWidth / 2 + 0.1, 0.01, 0);
  left.rotation.x = -Math.PI / 2;
  group.add(left);

  const right = new THREE.Mesh(shoulderGeo, shoulderMat);
  right.position.set(roadWidth / 2 - 0.1, 0.01, 0);
  right.rotation.x = -Math.PI / 2;
  group.add(right);

  // Lane dividers (dashed)
  const dashLength = 5;
  const dashGap = 5;
  const dashGeo = new THREE.PlaneGeometry(0.15, dashLength);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let lane = 1; lane < laneCount; lane++) {
    const x = -roadWidth / 2 + lane * laneWidth;
    for (let z = -segmentLength / 2; z < segmentLength / 2; z += dashLength + dashGap) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(x, 0.02, z);
      dash.rotation.x = -Math.PI / 2;
      group.add(dash);
    }
  }

  // Guardrails
  const railGeo = new THREE.BoxGeometry(0.2, 1, segmentLength);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.3 });

  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-roadWidth / 2 - 0.5, 0.5, 0);
  group.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(roadWidth / 2 + 0.5, 0.5, 0);
  group.add(rightRail);

  group.position.z = zPos;
  scene.add(group);
  return group;
}

// Initialize road segments
for (let i = 0; i < numSegments; i++) {
  roadSegments.push(createRoadSegment(-i * segmentLength));
}

// --- Car creation ---
const car = new THREE.Group();

// Car body
const bodyGeometry = new THREE.BoxGeometry(2.4, 0.6, 4.8);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x003399, roughness: 0.6, metalness: 0.3 });
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.castShadow = true;
bodyMesh.position.y = 0.35;
car.add(bodyMesh);

// Hood & trunk
const hoodGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
const hoodMat = new THREE.MeshStandardMaterial({ color: 0x002266 });
const hood = new THREE.Mesh(hoodGeo, hoodMat);
hood.position.set(0, 0.65, 1.4);
hood.rotation.x = -0.15;
hood.castShadow = true;
car.add(hood);

const trunk = new THREE.Mesh(hoodGeo, hoodMat);
trunk.position.set(0, 0.65, -1.8);
trunk.rotation.x = 0.1;
trunk.castShadow = true;
car.add(trunk);

// Windows
const windowGeo = new THREE.PlaneGeometry(2, 1.1);
const windowMat = new THREE.MeshStandardMaterial({ color: 0x111122, transparent: true, opacity: 0.6 });

const sideWindowL = new THREE.Mesh(windowGeo, windowMat);
sideWindowL.position.set(-1.2, 0.7, 0);
sideWindowL.rotation.y = Math.PI / 2;
car.add(sideWindowL);

const sideWindowR = new THREE.Mesh(windowGeo, windowMat);
sideWindowR.position.set(1.2, 0.7, 0);
sideWindowR.rotation.y = -Math.PI / 2;
car.add(sideWindowR);

const frontWindowGeo = new THREE.PlaneGeometry(2.4, 1);
const frontWindow = new THREE.Mesh(frontWindowGeo, windowMat);
frontWindow.position.set(0, 1.05, 2);
frontWindow.rotation.x = -0.3;
car.add(frontWindow);

const rearWindow = new THREE.Mesh(frontWindowGeo, windowMat);
rearWindow.position.set(0, 1.05, -2);
rearWindow.rotation.x = 0.3;
car.add(rearWindow);

// Wheels
const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

function createWheel(x, z) {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, 0.2, z);
  wheel.castShadow = true;

  const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
  const rim = new THREE.Mesh(rimGeo, rimMaterial);
  rim.rotation.z = Math.PI / 2;
  rim.position.set(0, 0, 0);
  wheel.add(rim);

  return wheel;
}

// Position wheels
car.add(createWheel(-0.95, 1.8));
car.add(createWheel(0.95, 1.8));
car.add(createWheel(-0.95, -1.8));
car.add(createWheel(0.95, -1.8));

car.position.y = 0.35;
car.position.z = 0;
scene.add(car);

// --- Controls and Movement ---
let moveForward = false, moveBackward = false, turnLeft = false, turnRight = false;
const maxSpeed = 2.5, acceleration = 0.06, deceleration = 0.04, steeringAngle = 0.03;
let speed = 0;

// Keyboard handlers
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') moveForward = true;
  if (e.key === 'ArrowDown' || e.key === 's') moveBackward = true;
  if (e.key === 'ArrowLeft' || e.key === 'a') turnLeft = true;
  if (e.key === 'ArrowRight' || e.key === 'd') turnRight = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') moveForward = false;
  if (e.key === 'ArrowDown' || e.key === 's') moveBackward = false;
  if (e.key === 'ArrowLeft' || e.key === 'a') turnLeft = false;
  if (e.key === 'ArrowRight' || e.key === 'd') turnRight = false;
});

// --- Speedometer UI ---
const speedometer = document.createElement('div');
speedometer.style.position = 'fixed';
speedometer.style.bottom = '20px';
speedometer.style.left = '20px';
speedometer.style.color = 'white';
speedometer.style.backgroundColor = 'rgba(0,0,0,0.5)';
speedometer.style.padding = '8px 12px';
speedometer.style.borderRadius = '8px';
speedometer.style.fontFamily = 'Arial, sans-serif';
speedometer.style.fontSize = '18px';
speedometer.style.userSelect = 'none';
speedometer.textContent = 'Speed: 0 mph';
document.body.appendChild(speedometer);

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Speed update
  if (moveForward) speed += acceleration;
  else if (moveBackward) speed -= acceleration;
  else speed += speed > 0 ? -deceleration : speed < 0 ? deceleration : 0;
  speed = Math.min(Math.max(speed, -maxSpeed / 2), maxSpeed);

  // Steering
  if (Math.abs(speed) > 0.01) {
    if (turnLeft) car.rotation.y += steeringAngle * (speed / maxSpeed);
    if (turnRight) car.rotation.y -= steeringAngle * (speed / maxSpeed);
  }

  // Car movement
  car.position.x -= Math.sin(car.rotation.y) * speed;
  car.position.z -= Math.cos(car.rotation.y) * speed;

  // Endless road recycling
  const first = roadSegments[0];
  if (car.position.z < first.position.z - segmentLength) {
    const last = roadSegments[roadSegments.length - 1];
    first.position.z = last.position.z - segmentLength;
    roadSegments.push(roadSegments.shift());
  }

  // Smooth camera follow
  const desiredCameraPos = new THREE.Vector3(
    car.position.x + Math.sin(car.rotation.y) * 6,
    5,
    car.position.z + Math.cos(car.rotation.y) * 6
  );
  camera.position.lerp(desiredCameraPos, 0.08); // smoother lerp
  camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

  // Update speedometer
  speedometer.textContent = `Speed: ${Math.abs((speed * 80).toFixed(0))} mph`;

  renderer.render(scene, camera);
}

animate();


