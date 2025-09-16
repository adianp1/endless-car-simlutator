// --- Basic Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Set sky blue background

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 12); // Position the camera

// --- WebGL Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });

if (!renderer.getContext()) {
  alert("WebGL context could not be initialized.");
} else {
  console.log("WebGL initialized successfully.");
}

if (!renderer.capabilities.isWebGL2) {
  console.log("WebGL2 is not supported, using WebGL1.");
}

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Render Without Any Object ---
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera); // Just render the scene (sky blue background)
}

animate(); // Start the animation loop



