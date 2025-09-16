// Main.js - Endless Car Simulator with Traffic and 3D Car

// --- THREE.js setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth/window.innerHeight, 0.1, 1000
);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Resize
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff,0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff,1);
directionalLight.position.set(10,20,10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// --- Ground ---
const groundGeo = new THREE.PlaneGeometry(500,500);
const groundMat = new THREE.MeshStandardMaterial({color:0x228B22});
const ground = new THREE.Mesh(groundGeo,groundMat);
ground.rotation.x = -Math.PI/2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// --- Mountains ---
function createMountain(x,z,height,width){
    const geo = new THREE.ConeGeometry(width,height,4);
    const mat = new THREE.MeshStandardMaterial({color:0x8B7D7B,flatShading:true});
    const mountain = new THREE.Mesh(geo,mat);
    mountain.position.set(x,height/2,z);
    mountain.rotation.y = Math.PI/4;
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    scene.add(mountain);
    return mountain;
}

const mountains = [];
const mountainPositions = [-100,-70,-40,-10,20,50,80];
for(let x of mountainPositions){
    const height = 20 + Math.random()*10;
    const width = 20 + Math.random()*10;
    mountains.push(createMountain(x,-150,height,width));
}

// --- Road ---
const laneCount = 3;
const laneWidth = 3.5;
const roadWidth = laneCount*laneWidth;
const segmentLength = 60;
const numSegments = 8;
let roadSegments = [];

function createRoadSegment(zPos){
    const roadGeo = new THREE.PlaneGeometry(roadWidth,segmentLength);
    const roadMat = new THREE.MeshStandardMaterial({color:0x202020});
    const road = new THREE.Mesh(roadGeo,roadMat);
    road.rotation.x = -Math.PI/2;
    road.position.z = zPos - segmentLength/2;
    road.receiveShadow = true;
    scene.add(road);

    const markings = new THREE.Group();

    const shoulderLineWidth = 0.15;
    const shoulderLineLength = segmentLength;
    const shoulderGeo = new THREE.PlaneGeometry(shoulderLineWidth, shoulderLineLength);
    const shoulderMat = new THREE.MeshBasicMaterial({color:0xffffff});

    const leftShoulder = new THREE.Mesh(shoulderGeo,shoulderMat);
    leftShoulder.position.set(-roadWidth/2 + shoulderLineWidth/2,0.01,zPos - segmentLength/2);
    leftShoulder.rotation.x = -Math.PI/2;
    markings.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo,shoulderMat);
    rightShoulder.position.set(roadWidth/2 - shoulderLineWidth/2,0.01,zPos - segmentLength/2);
    rightShoulder.rotation.x = -Math.PI/2;
    markings.add(rightShoulder);

    // lane dividers
    const dashLength = 4;
    const dashGap = 4;
    const dashGeo = new THREE.PlaneGeometry(shoulderLineWidth,dashLength);
    const dashMat = new THREE.MeshBasicMaterial({color:0xffffff});

    for(let lane=1;lane<laneCount;lane++){
        const xPos = -roadWidth/2 + lane*laneWidth;
        let zStart = zPos - segmentLength/2 + dashGap/2;
        for(let zDash=zStart; zDash<zPos + segmentLength/2; zDash+=dashLength+dashGap){
            const dash = new THREE.Mesh(dashGeo,dashMat);
            dash.position.set(xPos,0.02,zDash);
            dash.rotation.x = -Math.PI/2;
            markings.add(dash);
        }
    }

    // center divider
    const dividerLineWidth = 0.1;
    const dividerLineHeight = segmentLength;
    const dividerGeo = new THREE.PlaneGeometry(dividerLineWidth,dividerLineHeight);
    const yellowMat = new THREE.MeshBasicMaterial({color:0xFFFF00});

    const leftDivider = new THREE.Mesh(dividerGeo,yellowMat);
    leftDivider.position.set(-dividerLineWidth*1.5,0.03,zPos - segmentLength/2);
    leftDivider.rotation.x = -Math.PI/2;
    markings.add(leftDivider);

    const rightDivider = new THREE.Mesh(dividerGeo,yellowMat);
    rightDivider.position.set(dividerLineWidth*1.5,0.03,zPos - segmentLength/2);
    rightDivider.rotation.x = -Math.PI/2;
    markings.add(rightDivider);

    scene.add(markings);
    return {road,markings};
}

for(let i=0;i<numSegments;i++) roadSegments.push(createRoadSegment(-i*segmentLength));

// --- Traffic Car Class ---
class TrafficCar{
    constructor(x,z){
        const geo = new THREE.BoxGeometry(2,0.6,4);
        const mat = new THREE.MeshStandardMaterial({color:0xff0000});
        this.mesh = new THREE.Mesh(geo,mat);
        this.mesh.position.set(x,0.35,z);
        this.mesh.castShadow = true;
        scene.add(this.mesh);
    }

    update(deltaZ){
        this.mesh.position.z += deltaZ;
    }

    checkCollision(px,pz){
        const dx = this.mesh.position.x - px;
        const dz = this.mesh.position.z - pz;
        return Math.abs(dx)<1.5 && Math.abs(dz)<2.5;
    }
}

let trafficCars = [];
function spawnTraffic(){
    const lane = Math.floor(Math.random()*laneCount);
    const x = -roadWidth/2 + lane*laneWidth + laneWidth/2;
    const z = car.position.z - 100;
    trafficCars.push(new TrafficCar(x,z));
}

// --- Player Car (GLB Model) ---
let car;
const loader = new THREE.GLTFLoader();
loader.load('exterminator_00_interceptor_-_low_poly_model.glb', function(gltf){
    car = gltf.scene;
    car.scale.set(1,1,1);
    car.position.set(0,0.35,0);
    car.traverse(node=>{
        if(node.isMesh){
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(car);
}, undefined, function(error){console.error(error);});

// --- Controls ---
let moveForward=false, moveBackward=false, turnLeft=false, turnRight=false;
const maxSpeed=2.5, acceleration=0.06, deceleration=0.04, steeringAngle=0.03;
let speed=0;

window.addEventListener('keydown', e=>{
    switch(e.key){
        case 'ArrowUp':
        case 'w': moveForward=true; break;
        case 'ArrowDown':
        case 's': moveBackward=true; break;
        case 'ArrowLeft':
        case 'a': turnLeft=true; break;
        case 'ArrowRight':
        case 'd': turnRight=true; break;
    }
});
window.addEventListener('keyup', e=>{
    switch(e.key){
        case 'ArrowUp':
        case 'w': moveForward=false; break;
        case 'ArrowDown':
        case 's': moveBackward=false; break;
        case 'ArrowLeft':
        case 'a': turnLeft=false; break;
        case 'ArrowRight':
        case 'd': turnRight=false; break;
    }
});

// --- Speedometer ---
const speedometer = document.createElement('div');
speedometer.style.position='fixed';
speedometer.style.bottom='20px';
speedometer.style.left='20px';
speedometer.style.color='white';
speedometer.style.backgroundColor='rgba(0,0,0,0.5)';
speedometer.style.padding='8px 12px';
speedometer.style.borderRadius='8px';
speedometer.style.fontFamily='Arial,sans-serif';
speedometer.style.fontSize='18px';
speedometer.style.userSelect='none';
speedometer.textContent='Speed: 0 mph';
document.body.appendChild(speedometer);

// --- Animate Loop ---
function animate(){
    requestAnimationFrame(animate);
    if(!car) return;

    // Speed update
    if(moveForward) speed+=acceleration;
    else if(moveBackward) speed-=acceleration;
    else speed += (speed>0?-deceleration:(speed<0?deceleration:0));
    speed=Math.min(Math.max(speed,-maxSpeed/2),maxSpeed);

    // Steering
    if(Math.abs(speed)>0.01){
        if(turnLeft) car.rotation.y += steeringAngle*(speed/maxSpeed);
        if(turnRight) car.rotation.y -= steeringAngle*(speed/maxSpeed);
    }

    // Move car
    car.position.x -= Math.sin(car.rotation.y)*speed;
    car.position.z -= Math.cos(car.rotation.y)*speed;

    // Endless road
    const firstSegment = roadSegments[0];
    if(car.position.z < firstSegment.road.position.z - segmentLength){
        const lastSegment = roadSegments[roadSegments.length-1];
        firstSegment.road.position.z = lastSegment.road.position.z - segmentLength;
        firstSegment.markings.children.forEach(m=> m.position.z -= (lastSegment.road.position.z - firstSegment.road.position.z));
        roadSegments.push(roadSegments.shift());
    }

    // Spawn and update traffic
    if(Math.random()<0.02) spawnTraffic();
    trafficCars.forEach(tc=>tc.update(speed));
    
    // Collision
    trafficCars.forEach(tc=>{
        if(tc.checkCollision(car.position.x,car.position.z)){
            alert("Crash!");
            speed=0;
        }
    });

    // Camera
    const desired = new THREE.Vector3(
        car.position.x + Math.sin(car.rotation.y)*6,
        5,
        car.position.z + Math.cos(car.rotation.y)*6
    );
    camera.position.lerp(desired,0.08);
    camera.lookAt(car.position.x,car.position.y+1,car.position.z);

    // Speedometer
    speedometer.textContent=`Speed: ${Math.abs((speed*80).toFixed(0))} mph`;

    renderer.render(scene,camera);
}

animate();



