// --- Basic Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 12); // Position the camera slightly above and back

// --- WebGL Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
if (!renderer.capabilities.isWebGL2) {
  alert("WebGL2 is not supported, using WebGL1.");
} else {
  console.log("WebGL2 is supported.");
}

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting Setup (Ambient Light) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Full intensity white light
scene.add(ambientLight);

// --- Simple Geometry (Green Cube) ---
const geometry = new THREE.BoxGeometry(2, 2, 2); // Cube of size 2x2x2
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color (no light required)
const cube = new THREE.Mesh(geometry, material); // Create mesh with geometry and material
scene.add(cube); // Add cube to the scene

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Render Once ---
renderer.render(scene, camera); // Initial render of the scene

// --- Animate (optional) ---
function animate() {
  requestAnimationFrame(animate); // Keep animating

  // Rotate cube for some movement
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // Render the scene from the camera's perspective
  renderer.render(scene, camera);
}

animate(); // Start the animation loop


