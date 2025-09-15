// Main.js - Endless Car Simulator

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Road parameters
const roadWidth = 8;
const segmentLength = 50;
const numSegments = 7;

let roadSegments = [];

// Create a single road segment
function createRoadSegment(zPos) {
  const geometry = new THREE.BoxGeometry(roadWidth, 0.1, segmentLength);
  const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const segment = new THREE.Mesh(geometry, material);
  segment.position.z = zPos;
  segment.receiveShadow = true;
  scene.add(segment);

  // Add white dashed lines in middle for road markings
  const lineGeometry = new THREE.PlaneGeometry(0.2, segmentLength);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const dashCount = 10;
  for(let i = 0; i < dashCount; i++) {
    const dash = new THREE.Mesh(lineGeometry, lineMaterial);
    dash.position.set(0, 0.06, zPos - segmentLength/2 + i * (segmentLength/dashCount) + (segmentLength/dashCount)/2);
    scene.add(dash);
  }

  return segment;
}

// Initialize road segments
for(let i = 0; i < numSegments; i++) {
  roadSegments.push(createRoadSegment(-i * segmentLength));
}

// Car
const car = new THREE.Group();

// Car body
const bodyGeometry = new THREE.BoxGeometry(2, 0.7, 4);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.castShadow = true;
car.add(bodyMesh);

// Car wheels (cylinders)
const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

function createWheel(x, z) {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, -0.4, z);
  wheel.castShadow = true;
  return wheel;
}

car.add(createWheel(-0.9, 1.3));
car.add(createWheel(0.9, 1.3));
car.add(createWheel(-0.9, -1.3));
car.add(createWheel(0.9, -1.3));

scene.add(car);

car.position.y = 0.35;
car.position.z = 0;

// Controls state
let moveForward = false;
let moveBackward = false;
let turnLeft = false;
let turnRight = false;

// Speed and steering
let speed = 0;
const maxSpeed = 0.4;
const acceleration = 0.02;
const deceleration = 0.04;
const steeringAngle = 0.03;

// Keyboard events
window.addEventListener('keydown', (e) => {
  switch(e.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      turnLeft = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      turnRight = true;
      break;
  }
});

window.addEventListener('keyup', (e) => {
  switch(e.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      turnLeft = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      turnRight = false;
      break;
  }
});

// Speedometer UI
const speedometer = document.getElementById('speedometer');

// Main animate loop
function animate() {
  requestAnimationFrame(animate);

  // Handle acceleration
  if (moveForward) {
    speed += acceleration;
  } else if (moveBackward) {
    speed -= acceleration;
  } else {
    // natural deceleration
    if (speed > 0) speed -= deceleration;
    else if (speed < 0) speed += deceleration;
  }

  // Clamp speed
  speed = Math.min(maxSpeed, Math.max(-maxSpeed / 2, speed)); // half reverse speed

  // Handle steering only if speed is significant
  if (speed !== 0) {
    if (turnLeft) {
      car.rotation.y += steeringAngle * (speed / maxSpeed);
    }
    if (turnRight) {
      car.rotation.y -= steeringAngle * (speed / maxSpeed);
    }
  }

  // Move car forward in its local forward direction
  const forwardVector = new THREE.Vector3(0, 0, -1);
  forwardVector.applyEuler(car.rotation);
  forwardVector.multiplyScalar(speed);
  car.position.add(forwardVector);

  // Update camera behind car smoothly
  const cameraOffset = new THREE.Vector3(0, 5, 10);
  cameraOffset.applyEuler(car.rotation);
  const desiredCameraPos = car.position.clone().add(cameraOffset);
  camera.position.lerp(desiredCameraPos, 0.1);
  camera.lookAt(car.position);

  // Endless road logic - recycle road segments behind car
  const firstSegment = roadSegments[0];
  if (car.position.z < firstSegment.position.z - segmentLength) {
    // Move the segment to the front
    const lastSegment = roadSegments[roadSegments.length - 1];
    firstSegment.position.z = lastSegment.position.z - segmentLength;
    // reorder array
    roadSegments.push(roadSegments.shift());
  }

  // Update speedometer (rounded km/h, example conversion)
  speedometer.textContent = `Speed: ${Math.abs((speed * 100).toFixed(0))} km/h`;

  renderer.render(scene, camera);
}

animate();
