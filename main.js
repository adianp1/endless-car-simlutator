// --- Basic Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 12); // Position the camera

// --- WebGL Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Simple Object (Cube) ---
const geometry = new THREE.BoxGeometry(2, 2, 2); // Create a simple cube
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color (no need for lighting)
const cube = new THREE.Mesh(geometry, material); // Create mesh with geometry and material
scene.add(cube); // Add cube to the scene

// --- Camera and Object Position Check ---
alert("Camera and Cube Set Up");
alert("Camera Position: " + JSON.stringify(camera.position)); // Alert to show camera position
alert("Cube Position: " + JSON.stringify(cube.position)); // Alert to show cube position

// --- Simple Animation to Rotate the Cube ---
function animate() {
    requestAnimationFrame(animate); // Keep animating
    cube.rotation.x += 0.01; // Rotate the cube on X-axis
    cube.rotation.y += 0.01; // Rotate the cube on Y-axis
    renderer.render(scene, camera); // Render the scene with the camera
}

alert("Starting Animation Loop...");
animate(); // Start the animation loop

