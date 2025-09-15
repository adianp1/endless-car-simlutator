// Main.js - Interstate Road, Ford Focus Car, and Mountain Background

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground (grass)
const groundGeo = new THREE.PlaneGeometry(500, 500);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// Mountain background (simple low-poly mountain range)
function createMountain(x, z, height, width) {
  const geo = new THREE.ConeGeometry(width, height, 4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8B7D7B, flatShading: true });
  const mountain = new THREE.Mesh(geo, mat);
  mountain.position.set(x, height / 2, z);
  mountain.rotation.y = Math.PI / 4; // rotate for diamond shape
  mountain.receiveShadow = true;
  mountain.castShadow = true;
  scene.add(mountain);
  return mountain;
}

// Create multiple mountains on horizon
const mountains = [];
const mountainPositions = [-100, -70, -40, -10, 20, 50, 80];
for (let i = 0; i < mountainPositions.length; i++) {
  const x = mountainPositions[i];
  const z = -150;
  const height = 20 + Math.random() * 10;
  const width = 20 + Math.random() * 10;
  mountains.push(createMountain(x, z, height, width));
}

// INTERSTATE ROAD PARAMETERS
const laneCount = 3;
const laneWidth = 3.5;
const roadWidth = laneCount * laneWidth;
const segmentLength = 60;
const numSegments = 8;

let roadSegments = [];

// Create interstate road segment with lane markings
function createRoadSegment(zPos) {
  // Road base
  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x202020 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = zPos - segmentLength / 2;
  road.receiveShadow = true;
  scene.add(road);

  // Markings container
  const markings = new THREE.Group();
  scene.add(markings);

  // Shoulder lines - solid white lines on edges
  const shoulderLineWidth = 0.15;
  const shoulderLineLength = segmentLength;
  const shoulderGeo = new THREE.PlaneGeometry(shoulderLineWidth, shoulderLineLength);
  const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Left shoulder
  const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  leftShoulder.position.set(-roadWidth / 2 + shoulderLineWidth / 2, 0.01, zPos - segmentLength / 2);
  leftShoulder.rotation.x = -Math.PI / 2;
  markings.add(leftShoulder);

  // Right shoulder
  const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  rightShoulder.position.set(roadWidth / 2 - shoulderLineWidth / 2, 0.01, zPos - segmentLength / 2);
  rightShoulder.rotation.x = -Math.PI / 2;
  markings.add(rightShoulder);

  // Lane dividers - broken white lines between lanes
  const dashLength = 4;
  const dashGap = 4;
  const dashGeo = new THREE.PlaneGeometry(shoulderLineWidth, dashLength);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let lane = 1; lane < laneCount; lane++) {
    let xPos = -roadWidth / 2 + lane * laneWidth;
    let zStart = zPos - segmentLength / 2 + dashGap / 2;
    for (let zDash = zStart; zDash < zPos + segmentLength / 2; zDash += dashLength + dashGap) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(xPos, 0.02, zDash);
      dash.rotation.x = -Math.PI / 2;
      markings.add(dash);
    }
  }

  // Center divider - double yellow solid lines
  const dividerLineWidth = 0.1;
  const dividerLineHeight = segmentLength;
  const dividerGeo = new THREE.PlaneGeometry(dividerLineWidth, dividerLineHeight);
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });

  // Left line of divider
  const leftDivider = new THREE.Mesh(dividerGeo, yellowMat);
  leftDivider.position.set(-dividerLineWidth * 1.5, 0.03, zPos - segmentLength / 2);
  leftDivider.rotation.x = -Math.PI / 2;
  markings.add(leftDivider);

  // Right line of divider
  const rightDivider = new THREE.Mesh(dividerGeo, yellowMat);
  rightDivider.position.set(dividerLineWidth * 1.5, 0.03, zPos - segmentLength / 2);
  rightDivider.rotation.x = -Math.PI / 2;
  markings.add(rightDivider);

  return { road, markings };
}

// Initialize road segments
for (let i = 0; i < numSegments; i++) {
  roadSegments.push(createRoadSegment(-i * segmentLength));
}

// Ford Focus–style car (simplified)

// Car group container
const car = new THREE.Group();

// Main body (rounded rectangular box)
const bodyGeometry = new THREE.BoxGeometry(2.4, 0.6, 4.8);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x003399, roughness: 0.6, metalness: 0.3 });
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.castShadow = true;
bodyMesh.position.y = 0.35;
car.add(bodyMesh);

// Hood and trunk - slightly sloped planes to simulate car shape
const hoodGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
const hoodMat = new THREE.MeshStandardMaterial({ color: 0x002266 });
const hood = new THREE.Mesh(hoodGeo, hoodMat);
hood.position.set(0, 0.65, 1.4);
hood.rotation.x = -0.15;
hood.castShadow = true;
car.add(hood);

const trunkGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
const trunk = new THREE.Mesh(trunkGeo, hoodMat);
trunk.position.set(0, 0.65, -1.8);
trunk.rotation.x = 0.1;
trunk.castShadow = true;
car.add(trunk);

// Windows - dark tinted planes
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

// Wheels - cylinder with rims
const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

function createWheel(x, z) {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, 0.2, z);
  wheel.castShadow = true;

  // Rim - smaller cylinder
  const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
  const rim = new THREE.Mesh(rimGeo, rimMaterial);
  rim.rotation.z = Math.PI / 2;
  rim.position.set(0, 0, 0);
  wheel.add(rim);

  return wheel;
}

// Position wheels in typical Ford Focus layout
car.add(createWheel(-0.95, 1.8));
car.add(createWheel(0.95, 1.8));
car.add(createWheel(-0.95, -1.8));
car.add(createWheel(0.95, -1.8));

car.position.y = 0.35;
car.position.z = 0;
scene.add(car);

// Controls
let moveForward = false;
let moveBackward = false;
let turnLeft = false;
let turnRight = false;

let speed = 0;
const maxSpeed = 2.5; // Increased to simulate ~200 mph top speed
const acceleration = 0.02;
const deceleration = 0.04;
const steeringAngle = 0.035;

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

  // Move car forward in local direction
  const forwardVector = new THREE.Vector3(0, 0, -1);
  forwardVector.applyEuler(car.rotation);
  forwardVector.multiplyScalar(speed);
  car.position.add(forwardVector);

  // Camera follow with smooth lerp
  const camOffset = new THREE.Vector3(0, 6, 12);
  camOffset.applyEuler(car.rotation);
  const desiredCamPos = car.position.clone().add(camOffset);
  camera.position.lerp(desiredCamPos, 0.1);
  camera.lookAt(car.position);

  // Endless road recycling
  const firstSegment = roadSegments[0].road;
  if (car.position.z < firstSegment.position.z - segmentLength) {
    // Move segment forward
    const lastSegment = roadSegments[roadSegments.length - 1].road;
    roadSegments[0].road.position.z = lastSegment.position.z - segmentLength;
    roadSegments[0].markings.position.z = lastSegment.position.z - segmentLength;
    roadSegments.push(roadSegments.shift());
  }

  // Update speedometer
  speedometer.textContent = `Speed: ${Math.abs((speed * 80).toFixed(0))} mph`;


  renderer.render(scene, camera);
}

animate();
