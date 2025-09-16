// --- THREE.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth/window.innerHeight, 0.1, 1000
);
camera.position.set(0,6,12);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(10,50,10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// --- Ground ---
const groundGeo = new THREE.PlaneGeometry(500,500);
const groundMat = new THREE.MeshStandardMaterial({color:0x228B22});
const ground = new THREE.Mesh(groundGeo,groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

// --- Mountains ---
function createMountain(x,z,height,width){
  const geo = new THREE.ConeGeometry(width,height,4);
  const mat = new THREE.MeshStandardMaterial({color:0x8B7D7B, flatShading:true});
  const mountain = new THREE.Mesh(geo, mat);
  mountain.position.set(x,height/2,z);
  mountain.rotation.y = Math.PI/4;
  mountain.castShadow = false;
  scene.add(mountain);
  return mountain;
}
const mountainPositions = [-100,-70,-40,-10,20,50,80];
for(let x of mountainPositions){
  const height=20+Math.random()*10;
  const width=20+Math.random()*10;
  createMountain(x,-200,height,width);
}

// --- Road ---
const laneCount = 3;
const laneWidth = 3.5;
const roadWidth = laneCount*laneWidth;
const segmentLength = 60;
const numSegments = 8;
let roadSegments = [];

function createRoadSegment(zPos){
  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({color:0x202020});
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x=-Math.PI/2;
  road.position.z = zPos - segmentLength/2;
  road.receiveShadow=true;
  scene.add(road);

  const markings = new THREE.Group();
  const shoulderLineWidth=0.15;
  const shoulderLineLength=segmentLength;
  const shoulderGeo=new THREE.PlaneGeometry(shoulderLineWidth, shoulderLineLength);
  const shoulderMat=new THREE.MeshBasicMaterial({color:0xffffff});

  const leftShoulder=new THREE.Mesh(shoulderGeo, shoulderMat);
  leftShoulder.position.set(-roadWidth/2+shoulderLineWidth/2,0.01,zPos-segmentLength/2);
  leftShoulder.rotation.x=-Math.PI/2;
  markings.add(leftShoulder);

  const rightShoulder=new THREE.Mesh(shoulderGeo, shoulderMat);
  rightShoulder.position.set(roadWidth/2-shoulderLineWidth/2,0.01,zPos-segmentLength/2);
  rightShoulder.rotation.x=-Math.PI/2;
  markings.add(rightShoulder);

  const dashLength=4, dashGap=4;
  const dashGeo=new THREE.PlaneGeometry(shoulderLineWidth, dashLength);
  const dashMat=new THREE.MeshBasicMaterial({color:0xffffff});
  for(let lane=1;lane<laneCount;lane++){
    const xPos=-roadWidth/2+lane*laneWidth;
    let zStart=zPos-segmentLength/2+dashGap/2;
    for(let zDash=zStart;zDash<zPos+segmentLength/2;zDash+=dashLength+dashGap){
      const dash=new THREE.Mesh(dashGeo,dashMat);
      dash.position.set(xPos,0.02,zDash);
      dash.rotation.x=-Math.PI/2;
      markings.add(dash);
    }
  }

  // Center divider
  const dividerLineWidth=0.1, dividerLineHeight=segmentLength;
  const dividerGeo=new THREE.PlaneGeometry(dividerLineWidth, dividerLineHeight);
  const yellowMat=new THREE.MeshBasicMaterial({color:0xFFFF00});
  const leftDivider=new THREE.Mesh(dividerGeo, yellowMat);
  leftDivider.position.set(-dividerLineWidth*1.5,0.03,zPos-segmentLength/2);
  leftDivider.rotation.x=-Math.PI/2;
  markings.add(leftDivider);
  const rightDivider=new THREE.Mesh(dividerGeo, yellowMat);
  rightDivider.position.set(dividerLineWidth*1.5,0.03,zPos-segmentLength/2);
  rightDivider.rotation.x=-Math.PI/2;
  markings.add(rightDivider);

  scene.add(markings);
  return {road,markings};
}

for(let i=0;i<numSegments;i++) roadSegments.push(createRoadSegment(-i*segmentLength));

// --- Load GLB Car ---
let car, carLoaded=false;
const loader = new THREE.GLTFLoader();
loader.load('models/exterminator_00_interceptor_-_low_poly_model.glb', gltf=>{
    car=gltf.scene;
    car.scale.set(2,2,2);
    car.position.set(0,0.35,0);
    car.traverse(node=>{
        if(node.isMesh){ node.castShadow=true; node.receiveShadow=true; }
    });
    scene.add(car);
    carLoaded=true;
},undefined,err=>console.error(err));

// --- Controls ---
let moveForward=false, moveBackward=false, turnLeft=false, turnRight=false;
const maxSpeed=2.5, acceleration=0.06, deceleration=0.04, steeringAngle=0.03;
window.addEventListener('keydown',e=>{
    switch(e.key){
        case 'ArrowUp':case 'w':moveForward=true;break;
        case 'ArrowDown':case 's':moveBackward=true;break;
        case 'ArrowLeft':case 'a':turnLeft=true;break;
        case 'ArrowRight':case 'd':turnRight=true;break;
    }
});
window.addEventListener('keyup',e=>{
    switch(e.key){
        case 'ArrowUp':case 'w':moveForward=false;break;
        case 'ArrowDown':case 's':moveBackward=false;break;
        case 'ArrowLeft':case 'a':turnLeft=false;break;
        case 'ArrowRight':case 'd':turnRight=false;break;
    }
});

// --- UI ---
const speedometer=document.getElementById('speedometer');
const scoreDiv=document.createElement('div');
scoreDiv.style.position='fixed';
scoreDiv.style.top='40px';
scoreDiv.style.left='10px';
scoreDiv.style.color='white';
scoreDiv.style.fontFamily='monospace';
scoreDiv.style.background='rgba(0,0,0,0.5)';
scoreDiv.style.padding='10px';
scoreDiv.style.borderRadius='5px';
scoreDiv.style.userSelect='none';
scoreDiv.textContent='Score: 100';
document.body.appendChild(scoreDiv);

let score=100;

// --- Traffic ---
const trafficCars=[];
const trafficCount=5;
const laneXPositions=[-laneWidth,0,laneWidth];

function createTrafficCar(){
    const geometry=new THREE.BoxGeometry(2,1,4);
    const material=new THREE.MeshStandardMaterial({color:0xff0000});
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(laneXPositions[Math.floor(Math.random()*3)],0.5,-Math.random()*200-50);
    scene.add(mesh);
    trafficCars.push(mesh);
}

for(let i=0;i<trafficCount;i++) createTrafficCar();

// --- Animate ---
let speed=0;
function animate(){
    requestAnimationFrame(animate);
    if(!carLoaded) return;

    // Speed
    if(moveForward) speed+=acceleration;
    else if(moveBackward) speed-=acceleration;
    else { if(speed>0)speed-=deceleration; else if(speed<0)speed+=deceleration; }
    speed=Math.min(Math.max(speed,-maxSpeed/2),maxSpeed);

    // Steering
    if(turnLeft && Math.abs(speed)>0.01) car.rotation.y+=steeringAngle*(speed/maxSpeed);
    if(turnRight && Math.abs(speed)>0.01) car.rotation.y-=steeringAngle*(speed/maxSpeed);

    // Move car
    car.position.x-=Math.sin(car.rotation.y)*speed;
    car.position.z-=Math.cos(car.rotation.y)*speed;

    // Endless road
    const firstSeg=roadSegments[0];
    if(car.position.z<firstSeg.road.position.z-segmentLength){
        const lastSeg=roadSegments[roadSegments.length-1];
        firstSeg.road.position.z=lastSeg.road.position.z-segmentLength;
        firstSeg.markings.children.forEach(m=>{
            m.position.z=m.position.z-(lastSeg.road.position.z-firstSeg.road.position.z);
        });
        roadSegments.push(roadSegments.shift());
    }

    // Move traffic
    trafficCars.forEach(t=>{
        t.position.z+=speed; // relative movement
        if(t.position.z>car.position.z+30){
            t.position.z=-Math.random()*200-50;
            t.position.x=laneXPositions[Math.floor(Math.random()*3)];
        }
    });

    // Collision detection
    trafficCars.forEach(t=>{
        const dx=car.position.x-t.position.x;
        const dz=car.position.z-t.position.z;
        const distance=Math.sqrt(dx*dx+dz*dz);
        if(distance<2.5){ score-=10; t.position.z=-Math.random()*200-50; }
        else if(distance<4){ score-=20; } // near miss
    });

    score=Math.max(score,0);
    scoreDiv.textContent=`Score: ${score}`;

    // Smooth camera
    const desiredCameraPos=new THREE.Vector3(
        car.position.x + Math.sin(car.rotation.y)*6,
        5,
        car.position.z + Math.cos(car.rotation.y)*6
    );
    camera.position.lerp(desiredCameraPos,0.1);
    camera.lookAt(car.position.x,car.position.y+1,car.position.z);

    speedometer.textContent=`Speed: ${Math.abs((speed*80).toFixed(0))} mph`;
    renderer.render(scene,camera);
}
animate();



