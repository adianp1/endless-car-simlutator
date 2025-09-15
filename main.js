// Main.js - Realistic Interstate Driving Simulator
// With smooth camera, lane-locked traffic, and distant mountains backdrop

// --- THREE.js setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 5000
);
camera.position.set(0, 6, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 200, 100);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// --- Ground ---
const groundGeo = new THREE.PlaneGeometry(5000, 5000);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Distant Mountain Backdrop (Skybox style) ---
const skyGeo = new THREE.SphereGeometry(4000, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load("textures/mountains.jpg"), // <- supply your panoramic mountain texture
  side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// --- Road Parameters ---
const laneCount = 3;
const laneWidth = 3.5;
const roadWidth = laneCount * laneWidth;
const segmentLength = 80;
const numSegments = 10;

let roadSegments = [];

function createRoadSegment(zPos) {
  const group = new THREE.Group();

  // Road surface
  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -segmentLength / 2;
  road.receiveShadow = true;
  group.add(road);

  // Shoulders
  const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const shoulderGeo = new THREE.PlaneGeometry(0.2, segmentLength);

  const left = new THREE.Mesh(shoulderGeo, shoulderMat);
  left.position.set(-roadWidth / 2 + 0.1, 0.01, -segmentLength / 2);
  left.rotation.x = -Math.PI / 2;
  group.add(left);

  const right = new THREE.Mesh(shoulderGeo, shoulderMat);
  right.position.set(roadWidth / 2 - 0.1, 0.01, -segmentLength / 2);
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
      dash.position.set(x, 0.02, z + dashLength / 2);
      dash.rotation.x = -Math.PI / 2;
      group.add(dash);
    }
  }

  // Guardrails
  const railGeo = new THREE.BoxGeometry(0.2, 1, segmentLength);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.3 });

  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-roadWidth / 2 - 0.5, 0.5, -segmentLength / 2);
  group.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(roadWidth / 2 + 0.5, 0.5, -segmentLength / 2);
  group.add(rightRail);

  group.position.z = zPos;
  scene.add(group);
  return group;
}

// Build initial road
for (let i = 0; i < numSegments; i++) {
  roadSegments.push(createRoadSegment(-i * segmentLength));
}

// --- Player Car ---
const car = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 0.7, 4.5),
  new THREE.MeshStandardMaterial({ color: 0x0044cc })
);
body.position.y = 0.4;
body.castShadow = true;
car.add(body);
car.position.y = 0.35;
scene.add(car);

// --- Traffic Cars ---
const traffic = [];
function spawnTraffic(zPos, lane) {
  const carGeo = new THREE.BoxGeometry(2, 1, 4);
  const carMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
  const tCar = new THREE.Mesh(carGeo, carMat);
  tCar.position.set((lane - laneCount / 2 + 0.5) * laneWidth, 0.5, zPos);
  scene.add(tCar);
  traffic.push({
    mesh: tCar,
    lane: lane,
    speed: 0.6 + Math.random() * 1.0
  });
}
for (let i = 0; i < 6; i++) {
  spawnTraffic(-60 * (i + 1), Math.floor(Math.random() * laneCount));
}

// --- Controls ---
let speed = 0;
const maxSpeed = 2.8;
let moveForward = false, moveBackward = false, turnLeft = false, turnRight = false;

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
speedometer.style.padding = '6px 10px';
speedometer.style.borderRadius = '6px';
speedometer.style.fontFamily = 'Arial, sans-serif';
speedometer.style.fontSize = '16px';
document.body.appendChild(speedometer);

// --- Animation ---
let cameraTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  // Accel/decel
  if (moveForward) speed = Math.min(speed + 0.05, maxSpeed);
  else if (moveBackward) speed = Math.max(speed - 0.05, -maxSpeed / 2);
  else speed *= 0.98;

  // Steering (strafe only, keep car forward-facing)
  if (turnLeft) car.position.x -= 0.1;
  if (turnRight) car.position.x += 0.1;
  car.position.x = Math.max(-roadWidth / 2 + 1, Math.min(roadWidth / 2 - 1, car.position.x));

  // Move car forward
  car.position.z -= speed;

  // Road recycling
  const first = roadSegments[0];
  if (car.position.z < first.position.z - segmentLength) {
    const last = roadSegments[roadSegments.length - 1];
    first.position.z = last.position.z - segmentLength;
    roadSegments.push(roadSegments.shift());
  }

  // Traffic update (lane-locked)
  for (let t of traffic) {
    t.mesh.position.z += t.speed;
    if (t.mesh.position.z > car.position.z + 60) {
      t.mesh.position.z = car.position.z - 400;
      t.lane = Math.floor(Math.random() * laneCount);
      t.mesh.position.x = (t.lane - laneCount / 2 + 0.5) * laneWidth;
      t.speed = 0.6 + Math.random() * 1.0;
    }
  }

  // Camera smoothing (springy follow)
  const desired = new THREE.Vector3(car.position.x, 5, car.position.z + 12);
  cameraTarget.lerp(desired, 0.05);
  camera.position.copy(cameraTarget);
  camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

  // Speedometer
  speedometer.textContent = `Speed: ${Math.abs((speed * 80).toFixed(0))} mph`;

  renderer.render(scene, camera);
}
animate();

