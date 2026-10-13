import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const car = {
    x: 400,
    y: 300,
    width: 26,
    height: 52,
    angle: 0,
    moveAngle: 0,
    speed: 0,
    maxSpeed: 14,
    acceleration: 0.18,
    braking: 0.45,
    friction: 0.04,
    turnSpeed: 0.045,
    grip: 0.15,
    gear: 1
};

const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

const skidMarks = [];

// Sistema de Áudio (Web Audio API)
let audioCtx = null;
let engineOsc = null;
let engineGain = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Som do motor (Oscilador de onda dente de serra para simular ronco)
    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(60, audioCtx.currentTime);
    
    engineGain = audioCtx.createGain();
    engineGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    
    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
}

// Ativa o áudio no primeiro clique/tecla para cumprir regras dos navegadores
window.addEventListener('keydown', initAudio, { once: true });
window.addEventListener('click', initAudio, { once: true });

function updateAudio() {
    if (!audioCtx || !engineOsc) return;
    // Frequência do motor sobe com a velocidade e marcha
    let targetFreq = 50 + (Math.abs(car.speed) / car.maxSpeed) * 250;
    engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
}

// Câmera
const camera = {
    x: 0,
    y: 0,
    update(target) {
        this.x += (target.x - canvas.width / 2 - this.x) * 0.1;
        this.y += (target.y - canvas.height / 2 - this.y) * 0.1;
    }
};

function update() {
    if (keys['ArrowUp'] || keys['KeyW']) {
        car.speed += car.acceleration;
        if (car.speed > car.maxSpeed) car.speed = car.maxSpeed;
    } else if (keys['ArrowDown'] || keys['KeyS']) {
        car.speed -= car.braking;
        if (car.speed < -car.maxSpeed / 3) car.speed = -car.maxSpeed / 3;
    } else {
        if (car.speed > 0) {
            car.speed -= car.friction;
            if (car.speed < 0) car.speed = 0;
        } else if (car.speed < 0) {
            car.speed += car.friction;
            if (car.speed > 0) car.speed = 0;
        }
    }

    if (car.speed === 0) car.gear = 1;
    else car.gear = Math.min(7, Math.floor(Math.abs(car.speed) / (car.maxSpeed / 7)) + 1);

    if (Math.abs(car.speed) > 0.5) {
        const speedFactor = Math.min(Math.abs(car.speed) / car.maxSpeed, 1);
        const directionFactor = car.speed > 0 ? 1 : -1;

        if (keys['ArrowLeft'] || keys['KeyA']) car.angle -= car.turnSpeed * speedFactor * directionFactor;
        if (keys['ArrowRight'] || keys['KeyD']) car.angle += car.turnSpeed * speedFactor * directionFactor;
    }

    let angleDifference = car.angle - car.moveAngle;
    car.moveAngle += angleDifference * car.grip;

    if (Math.abs(angleDifference) > 0.15 && Math.abs(car.speed) > 5) {
        skidMarks.push({ x: car.x, y: car.y, alpha: 0.4 });
        if (skidMarks.length > 150) skidMarks.shift();
    }

    // Função matemática da pista com curvas (traçado senoidal baseado na coordenada Y)
    const trackCenterX = Math.sin(car.y / 400) * 400; 
    const distanceFromCenter = Math.abs(car.x - trackCenterX);
    
    if (distanceFromCenter > 250) {
        car.speed *= 0.94; // Fora da pista (grama) desacelera
    }

    car.x += Math.sin(car.moveAngle) * car.speed;
    car.y -= Math.cos(car.moveAngle) * car.speed;

    camera.update(car);
    updateAudio();
}

function drawTrack() {
    ctx.fillStyle = '#2e5e2e'; // Grama de fundo
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Desenha a pista com curvas usando segmentos verticais
    for (let y = -4000; y < 4000; y += 40) {
        let centerX = Math.sin(y / 400) * 400;

        // Asfalto
        ctx.fillStyle = '#222222';
        ctx.fillRect(centerX - 250, y, 500, 42);

        // Zebras nas bordas da pista
        ctx.fillStyle = (Math.floor(y / 40) % 2 === 0) ? '#ffffff' : '#cc0000';
        ctx.fillRect(centerX - 260, y, 10, 42);
        ctx.fillRect(centerX + 250, y, 10, 42);
    }

    // Marcas de pneus
    skidMarks.forEach(mark => {
        ctx.fillStyle = `rgba(0, 0, 0, ${mark.alpha})`;
        ctx.fillRect(mark.x - 2, mark.y - 2, 4, 4);
    });

    ctx.restore();
}

function drawCar() {
    ctx.save();
    ctx.translate(car.x - camera.x, car.y - camera.y);
    ctx.rotate(car.angle);

    ctx.fillStyle = '#0033cc';
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

    ctx.fillStyle = '#111111';
    ctx.fillRect(-car.width / 2 - 4, -car.height / 2, car.width + 8, 5);
    ctx.fillRect(-car.width / 2 - 2, car.height / 2 - 5, car.width + 4, 6);

    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawHUD() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(20, 20, 220, 100);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 220, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`VEL: ${Math.round(Math.abs(car.speed) * 20)} km/h`, 35, 55);
    ctx.fillText(`MARCHA: ${car.gear}`, 35, 90);
}

function gameLoop() {
    update();
    drawTrack();
    drawCar();
    drawHUD();

    requestAnimationFrame(gameLoop);
}

gameLoop();
 THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.195,10),mat(0x747b83,.35,.65));hub.rotation.z=Math.PI/2;hub.position.set(x,.3,z);root.add(hub);
 }
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.25,.035,6,12,Math.PI),mat(0xb8c0c9,.4,.7));halo.rotation.z=Math.PI;halo.position.set(0,.88,.08);root.add(halo);
 return root;
}
const player=makeCar(0xe51d2a);scene.add(player);
const aiColors=[0x2768d9,0xf2f0e7,0xf0b51c,0x148b5c,0x8a49c9,0xe36c25,0x38a8b5,0x22252b,0xd5d5d5];
const rivals=aiColors.map((c,i)=>{const car=makeCar(c,String(i+1));scene.add(car);return {mesh:car,t:(.985-i*.0045+1)%1,speed:.19+Math.random()*.045,lane:(i%3-1)*2.1,lap:0,offset:i};});
const playerState={t:0,speed:0,lane:0,steer:0,lap:1,elapsed:0,condition:100,started:false,finished:false,offtrack:false};
let paused=true, last=performance.now(), raceTime=0, countdown=0;
const held={left:false,right:false,throttle:false,brake:false};
function placeOnTrack(mesh,t,lane=0,height=0){const p=curve.getPointAt((t%1+1)%1),tan=curve.getTangentAt((t%1+1)%1),side=new THREE.Vector3(-tan.z,0,tan.x);mesh.position.copy(p).addScaledVector(side,lane);mesh.position.y=height;mesh.rotation.y=Math.atan2(tan.x,tan.z);return {p,tan,side}}
function updateCar(mesh,t,lane,height=0){return placeOnTrack(mesh,t,lane,height)}
function formatTime(s){const m=Math.floor(s/60),sec=s%60;return `${String(m).padStart(2,'0')}:${sec.toFixed(1).padStart(4,'0')}`}
function updateHUD(){
 document.querySelector('#speed').textContent=String(Math.round(playerState.speed*520)).padStart(3,'0');
 document.querySelector('#gear').textContent=playerState.speed<.025?'1':String(Math.min(7,Math.max(1,Math.floor(playerState.speed*16)+1)));
 document.querySelector('#rpm').textContent=String(Math.round(playerState.speed*12500));
 document.querySelector('#rpmbar').style.width=`${Math.min(100,playerState.speed*360)}%`;
 document.querySelector('#condition').textContent=`${Math.max(0,Math.round(playerState.condition))}%`;
 document.querySelector('#lap').textContent=`${playerState.lap}/3`;
 document.querySelector('#time').textContent=formatTime(raceTime);
 const sorted=[{t:playerState.t,player:true},...rivals.map(r=>({t:r.t,player:false}))].sort((a,b)=>b.t-a.t);
 document.querySelector('#pos').textContent=String(sorted.findIndex(x=>x.player)+1).padStart(2,'0');
}
function showOverlay(mode){
 const overlay=document.querySelector('#overlay');overlay.classList.add('visible');
 document.querySelector('#start').hidden=mode==='pause';
 document.querySelector('#resume').hidden=mode!=='pause';
 document.querySelector('.panel h1').innerHTML=mode==='finish'?'CORRIDA<br><em>CONCLUÍDA</em>':'FORMULA <em>ONE</em><br><span>06</span> WEB';
 document.querySelector('.panel p').textContent=mode==='finish'?`Você completou a demonstração em ${formatTime(raceTime)}. Recarregue para reiniciar a corrida.`:'Protótipo 3D de corrida inspirado nos jogos de Fórmula 1 da era PS2. Física e arte são reconstruídas do zero.';
}
function startRace(){document.querySelector('#overlay').classList.remove('visible');paused=false;playerState.started=true;document.querySelector('#message').textContent='VAMOS!';setTimeout(()=>{if(!paused)document.querySelector('#message').textContent='';},1500)}
document.querySelector('#start').addEventListener('click',()=>{if(playerState.finished){location.reload();return}startRace()});
document.querySelector('#resume').addEventListener('click',startRace);
document.querySelector('#pause').addEventListener('click',()=>{if(!playerState.started)return;paused=true;showOverlay('pause')});
document.querySelectorAll('[data-control]').forEach(btn=>{
 const key=btn.dataset.control;
 const down=e=>{e.preventDefault();held[key]=true;btn.classList.add('active');try{btn.setPointerCapture(e.pointerId)}catch{}};
 const up=e=>{e.preventDefault();held[key]=false;btn.classList.remove('active')};
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
});
addEventListener('keydown',e=>{const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'throttle',' ':'throttle',ArrowDown:'brake',s:'brake'};if(map[e.key]){held[map[e.key]]=true;e.preventDefault()}if(e.key==='Escape'&&playerState.started){paused=!paused;if(paused)showOverlay('pause');else document.querySelector('#overlay').classList.remove('visible')}});
addEventListener('keyup',e=>{const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'throttle',' ':'throttle',ArrowDown:'brake',s:'brake'};if(map[e.key])held[map[e.key]]=false});
function loop(now){
 requestAnimationFrame(loop);const dt=Math.min(.04,(now-last)/1000);last=now;
 if(!paused&&playerState.started&&!playerState.finished){
  raceTime+=dt;
  const accel=held.throttle?0.22:0,braking=held.brake?0.38:0;
  playerState.speed=THREE.MathUtils.clamp(playerState.speed+(accel-braking-.035)*dt,0,.62);
  const turn=(held.left?-1:0)+(held.right?1:0);
  playerState.steer=THREE.MathUtils.lerp(playerState.steer,turn,.12);
  playerState.lane+=playerState.steer*dt*(1.6+playerState.speed*3.4);
  playerState.lane*=Math.pow(.985,dt*60);
  const forward=playerState.speed/trackLength*95;
  const previousT=playerState.t;
  playerState.t=(playerState.t+forward*dt)%1;
  if(playerState.t<previousT && raceTime>4){playerState.lap++;if(playerState.lap>3){playerState.finished=true;paused=true;showOverlay('finish')}}
  const off=Math.abs(playerState.lane)>6.3;
  if(off&&!playerState.offtrack){playerState.condition=Math.max(0,playerState.condition-3);document.querySelector('#message').textContent='FORA DA PISTA!';}
  playerState.offtrack=off;
  if(!off)document.querySelector('#message').textContent='';
  playerState.lane=THREE.MathUtils.clamp(playerState.lane,-9,9);
  for(const r of rivals){
   const old=r.t;r.t=(r.t+r.speed*dt/trackLength*100)%1;
   if(r.t<old)r.lap++;
   const p=curve.getPointAt(r.t),tan=curve.getTangentAt(r.t),side=new THREE.Vector3(-tan.z,0,tan.x);
   r.mesh.position.copy(p).addScaledVector(side,r.lane);r.mesh.position.y=.02;r.mesh.rotation.y=Math.atan2(tan.x,tan.z);
  }
 }
 const info=placeOnTrack(player,playerState.t,playerState.lane,.02);
 const speedBlend=playerState.speed/.62;
 const camPos=player.position.clone().add(new THREE.Vector3(0,3.1+speedBlend*1.3,-7.4-speedBlend*1.3));
 camera.position.lerp(camPos,1-Math.pow(.001,dt));
 const look=player.position.clone().add(new THREE.Vector3(0,.6,3.4));camera.lookAt(look);
 camera.fov=THREE.MathUtils.lerp(camera.fov,62+speedBlend*5,.04);camera.updateProjectionMatrix();
 updateHUD();renderer.render(scene,camera);
}
placeOnTrack(player,0,0,.02);
for(const r of rivals){const p=curve.getPointAt(r.t);updateCar(r.mesh,r.t,r.lane,.02)}
requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(innerWidth,innerHeight)});
document.querySelector('#loading').style.opacity='0';setTimeout(()=>document.querySelector('#loading')?.remove(),500);
