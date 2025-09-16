// --- Basic Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 6, 12);

// --- Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting Setup ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Full intensity
scene.add(ambientLight);

// --- Simple Geometry (Cube) ---
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green cube
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Rotate the cube for some movement
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // Render the scene from the camera's perspective
  renderer.render(scene, camera);
}

animate();

