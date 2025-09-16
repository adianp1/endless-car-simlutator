// --- Basic Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth/window.innerHeight, 0.1, 1000
);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;  // Disable shadows for testing
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Lower intensity for testing
scene.add(ambientLight);

// --- Road (Simplified) ---
const laneCount = 3;
const laneWidth = 3.5;
const roadWidth = laneCount * laneWidth;
const segmentLength = 60;

function createRoadSegment(zPos) {
  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x202020 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = zPos - segmentLength / 2;
  scene.add(road);
  return road;
}

const roadSegments = [];
for (let i = 0; i < 8; i++) roadSegments.push(createRoadSegment(-i * segmentLength));

// --- Simple Car (Test) ---
const car = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
car.position.set(0, 0.5, 0);
scene.add(car);

// --- Traffic Cars (Test) ---
const trafficCars = [];
const laneXPositions = [-laneWidth, 0, laneWidth];

function createTrafficCar() {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  mesh.position.set(laneXPositions[Math.floor(Math.random() * 3)], 0.5, -Math.random() * 200 - 50);
  scene.add(mesh);
  trafficCars.push(mesh);
}

for (let i = 0; i < 5; i++) createTrafficCar();

// --- Controls (Keyboard) ---
let moveForward = false, moveBackward = false, turnLeft = false, turnRight = false;
const maxSpeed = 2.5, acceleration = 0.06, deceleration = 0.04, steeringAngle = 0.03;

window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w': moveForward = true; break;
    case 'ArrowDown':
    case 's': moveBackward = true; break;
    case 'ArrowLeft':
    case 'a': turnLeft = true; break;
    case 'ArrowRight':
    case 'd': turnRight = true; break;
  }
});

window.addEventListener('keyup', e => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w': moveForward = false; break;
    case 'ArrowDown':
    case 's': moveBackward = false; break;
    case 'ArrowLeft':
    case 'a': turnLeft = false; break;
    case 'ArrowRight':
    case 'd': turnRight = false; break;
  }
});

// --- Game Loop ---
let speed = 0;
function animate() {
  requestAnimationFrame(animate);

  // Speed adjustments
  if (moveForward) speed += acceleration;
  else if (moveBackward) speed -= acceleration;
  else if (speed > 0) speed -= deceleration;
  else if (speed < 0) speed += deceleration;
  speed = Math.min(Math.max(speed, -maxSpeed / 2), maxSpeed);

  // Steering
  if (turnLeft && Math.abs(speed) > 0.01) car.rotation.y += steeringAngle * (speed / maxSpeed);
  if (turnRight && Math.abs(speed) > 0.01) car.rotation.y -= steeringAngle * (speed / maxSpeed);

  // Move car
  car.position.x -= Math.sin(car.rotation.y) * speed;
  car.position.z -= Math.cos(car.rotation.y) * speed;

  // Endless road (moving segments)
  const firstSeg = roadSegments[0];
  if (car.position.z < firstSeg.position.z - segmentLength) {
    const lastSeg = roadSegments[roadSegments.length - 1];
    firstSeg.position.z = lastSeg.position.z - segmentLength;
    roadSegments.push(roadSegments.shift());
  }

  // Move traffic
  trafficCars.forEach(t => {
    t.position.z += speed;
    if (t.position.z > car.position.z + 30) {
      t.position.z = -Math.random() * 200 - 50;
      t.position.x = laneXPositions[Math.floor(Math.random() * 3)];
    }
  });

  // Smooth camera
  const desiredCameraPos = new THREE.Vector3(
    car.position.x + Math.sin(car.rotation.y) * 6,
    5,
    car.position.z + Math.cos(car.rotation.y) * 6
  );
  camera.position.lerp(desiredCameraPos, 0.1);
  camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

  renderer.render(scene, camera);
}
animate();



