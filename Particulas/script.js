const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const popSound = document.getElementById('popSound');

let width, height;
let particles = [];
let mouse = { x: null, y: null, radius: 150 };
let currentState = 'waiting';

const PARTICLE_COUNT = 1000;
const TEXT_SIZE = 80;
const FONT_FAMILY = 'Pacifico';

const animationSequence = [
    { text: "Te amo", time: 2500 },
    { text: "mi niña", time: 2500 },
    { text: "ojitos bonitos", time: 3000 },
    { text: "gracias por", time: 3000 },
    { text: "existir", time: 3000 },
    { shape: "heart", time: null }
];
let sequenceIndex = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if(currentState === 'waiting') initParticles();
}
window.addEventListener('resize', resize);

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.targetX = null;
        this.targetY = null;
        this.size = Math.random() * 1.5 + 1;
        this.density = (Math.random() * 30) + 1;
        this.isActiveTarget = false;
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 20, 20, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x + 1, this.y + 1, this.size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        if (currentState === 'waiting') {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                let force = (mouse.radius - distance) / mouse.radius;
                this.x -= (dx / distance) * force * this.density;
                this.y -= (dy / distance) * force * this.density;
            } else {
                if (this.x !== this.baseX) this.x -= (this.x - this.baseX) / 20;
                if (this.y !== this.baseY) this.y -= (this.y - this.baseY) / 20;
            }
        } else if (currentState === 'animating' || currentState === 'finished') {
            if (this.isActiveTarget && this.targetX !== null) {
                this.x += (this.targetX - this.x) * 0.08;
                this.y += (this.targetY - this.y) * 0.08;
            } else {
                let dx = this.x - width / 2;
                let dy = this.y - height / 2;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    this.x += (dx / distance) * 4;
                    this.y += (dy / distance) * 4;
                }
            }
        }
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(Math.random() * width, Math.random() * height));
    }
}

function getTextCoordinates(text) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.fillStyle = 'white';
    tempCtx.font = `${TEXT_SIZE}px ${FONT_FAMILY}`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text, width / 2, height / 2);
    const data = tempCtx.getImageData(0, 0, width, height).data;
    let coordinates = [];
    for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
            if (data[(y * width + x) * 4 + 3] > 128) coordinates.push({ x, y });
        }
    }
    return coordinates;
}

function getHeartCoordinates() {
    let coordinates = [];
    for(let layer = 1; layer <= 4; layer++) {
        let scale = (Math.min(width, height) / 45) * layer * 0.6;
        let steps = 60 * layer;
        for(let i = 0; i < steps; i++) {
            let t = (Math.PI * 2 * i) / steps;
            let x = 16 * Math.pow(Math.sin(t), 3);
            let y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            coordinates.push({ x: width/2 + x * scale, y: height/2 - 20 - y * scale });
        }
    }
    return coordinates;
}

function runSequence() {
    if (sequenceIndex >= animationSequence.length) {
        currentState = 'finished';
        return;
    }
    const currentStep = animationSequence[sequenceIndex];
    let targetPoints = currentStep.text ? getTextCoordinates(currentStep.text) : getHeartCoordinates();
    
    if (popSound) {
        popSound.currentTime = 0;
        popSound.play().catch(e => console.log("Navegador bloqueó el audio automático"));
    }

    particles.sort(() => Math.random() - 0.5);
    particles.forEach((particle, index) => {
        if (index < targetPoints.length) {
            particle.targetX = targetPoints[index].x;
            particle.targetY = targetPoints[index].y;
            particle.isActiveTarget = true;
            particle.size = Math.random() * 1.5 + 1.5;
        } else {
            particle.isActiveTarget = false;
            particle.size = Math.random() * 1 + 0.5;
        }
    });

    if (currentStep.time) {
        setTimeout(() => {
            sequenceIndex++;
            runSequence();
        }, currentStep.time);
    }
}

function animate() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.25)';
    ctx.fillRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => {
    if(currentState === 'waiting') { mouse.x = e.x; mouse.y = e.y; }
});
window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    currentState = 'animating';
    mouse.radius = 0;
    runSequence();
});

resize();
initParticles();
animate();