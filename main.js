// Main.js - Endless Interstate Driving Simulator with Guardrails, Traffic, and Exits

// --- THREE.js setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 2000
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
const groundGeo = new THREE.PlaneGeometry(2000, 2000);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// --- Mountains (scenery) ---
function createMountain(x, z, height, width) {
  const geo = new THREE.ConeGeometry(width, height, 6);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8B7D7B, flatShading: true });
  const mountain = new THREE.Mesh(geo, mat);
  mountain.position.set(x, height / 2, z);
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  scene.add(mountain);
  return mountain;
}

// Place mountains far enough away so car never "hits" them
for (let i = -5; i <= 5; i++) {
  for (let j = 0; j < 5; j++) {
    const height = 30 + Math.random() * 20;
    const width = 30 + Math.random() * 15;
    createMountain(i * 80, -200 - j * 100, height, width);
    createMountain(i * 80, 200 + j * 100, height, width);
  }
}

// --- Road Parameters ---
const laneCount = 3;
const laneWidth = 3.5;
const roadWidth = laneCount * laneWidth;
const segmentLength = 60;
const numSegments = 8;

let roadSegments = [];

// Create a single road segment with lane markings + guardrails
function createRoadSegment(zPos) {
  const group = new THREE.Group();

  // Road base
  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x202020 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -segmentLength / 2;
  road.receiveShadow = true;
  group.add(road);

  // Shoulders (white lines)
  const shoulderLineWidth = 0.15;
  const shoulderGeo = new THREE.PlaneGeometry(shoulderLineWidth, segmentLength);
  const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  leftShoulder.position.set(-roadWidth / 2 + shoulderLineWidth / 2, 0.01, -segmentLength / 2);
  leftShoulder.rotation.x = -Math.PI / 2;
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  rightShoulder.position.set(roadWidth / 2 - shoulderLineWidth / 2, 0.01, -segmentLength / 2);
  rightShoulder.rotation.x = -Math.PI / 2;
  group.add(rightShoulder);

  // Lane dividers (dashed)
  const dashLength = 4;
  const dashGap = 4;
  const dashGeo = new THREE.PlaneGeometry(0.15, dashLength);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let lane = 1; lane < laneCount; lane++) {
    const xPos = -roadWidth / 2 + lane * laneWidth;
    for (let z = -segmentLength / 2; z < segmentLength / 2; z += dashLength + dashGap) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(xPos, 0.02, z + dashLength / 2);
      dash.rotation.x = -Math.PI / 2;
      group.add(dash);
    }
  }

  // Guardrails
  const railHeight = 1;
  const railThickness = 0.2;
  const railGeo = new THREE.BoxGeometry(railThickness, railHeight, segmentLength);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });

  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-roadWidth / 2 - 0.5, railHeight / 2, -segmentLength / 2);
  group.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(roadWidth / 2 + 0.5, railHeight / 2, -segmentLength / 2);
  group.add(rightRail);

  group.position.z = zPos;
  scene.add(group);

  return group;
}

// Initialize road
for (let i = 0; i < numSegments; i++) {
  roadSegments.push(createRoadSegment(-i * segmentLength));
}

// --- Car (player) ---
const car = new THREE.Group();
const bodyGeometry = new THREE.BoxGeometry(2.4, 0.6, 4.8);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x003399, roughness: 0.6, metalness: 0.3 });
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.castShadow = true;
bodyMesh.position.y = 0.35;
car.add(bodyMesh);

// Wheels
const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
function createWheel(x, z) {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, 0.2, z);
  wheel.castShadow = true;
  return wheel;
}
car.add(createWheel(-0.95, 1.8));
car.add(createWheel(0.95, 1.8));
car.add(createWheel(-0.95, -1.8));
car.add(createWheel(0.95, -1.8));

car.position.y = 0.35;
car.position.z = 0;
scene.add(car);

// --- Traffic cars ---
const traffic = [];
function spawnTraffic(zPos, lane) {
  const carGeo = new THREE.BoxGeometry(2, 1, 4);
  const carMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
  const tCar = new THREE.Mesh(carGeo, carMat);
  tCar.position.set((lane - laneCount / 2 + 0.5) * laneWidth, 0.5, zPos);
  scene.add(tCar);
  traffic.push({ mesh: tCar, speed: 0.5 + Math.random() * 1.2 });
}
spawnTraffic(-40, 0);
spawnTraffic(-80, 2);

// --- Exit ramp (example) ---
function createExit(zPos) {
  const exitGeo = new THREE.PlaneGeometry(roadWidth, 40);
  const exitMat = new THREE.MeshStandardMaterial({ color: 0x303030 });
  const exit = new THREE.Mesh(exitGeo, exitMat);
  exit.rotation.x = -Math.PI / 2;
  exit.rotation.z = -0.25; // angle off
  exit.position.set(roadWidth / 2, 0.01, zPos);
  scene.add(exit);
}
createExit(-300);

// --- Controls ---
let moveForward = false, moveBackward = false, turnLeft = false, turnRight = false;
const maxSpeed = 2.5;
let speed = 0;
const acceleration = 0.06;
const deceleration = 0.04;
const steeringAngle = 0.03;

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

// --- Speedometer ---
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
speedometer.textContent = 'Speed: 0 mph';
document.body.appendChild(speedometer);

// --- Animate loop ---
function animate() {
  requestAnimationFrame(animate);

  // Speed logic
  if (moveForward) speed += acceleration;
  else if (moveBackward) speed -= acceleration;
  else {
    if (speed > 0) speed -= deceleration;
    else if (speed < 0) speed += deceleration;
  }
  speed = Math.min(Math.max(speed, -maxSpeed / 2), maxSpeed);

  if (turnLeft && Math.abs(speed) > 0.01) car.rotation.y += steeringAngle * (speed / maxSpeed);
  if (turnRight && Math.abs(speed) > 0.01) car.rotation.y -= steeringAngle * (speed / maxSpeed);

  car.position.x -= Math.sin(car.rotation.y) * speed;
  car.position.z -= Math.cos(car.rotation.y) * speed;

  // Road recycling
  const first = roadSegments[0];
  if (car.position.z < first.position.z - segmentLength) {
    const last = roadSegments[roadSegments.length - 1];
    first.position.z = last.position.z - segmentLength;
    roadSegments.push(roadSegments.shift());
  }

  // Traffic update
  for (let t of traffic) {
    t.mesh.position.z += t.speed;
    if (t.mesh.position.z > car.position.z + 50) {
      t.mesh.position.z = car.position.z - 200;
    }
  }

  // Camera follow
  const desiredCameraPos = new THREE.Vector3(
    car.position.x + Math.sin(car.rotation.y) * 6,
    5,
    car.position.z + Math.cos(car.rotation.y) * 6
  );
  camera.position.lerp(desiredCameraPos, 0.1);
  camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

  // Speedometer
  speedometer.textContent = `Speed: ${Math.abs((speed * 80).toFixed(0))} mph`;

  renderer.render(scene, camera);
}
animate();
