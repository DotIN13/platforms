import { settings, ctx } from './settings.js';
import { t } from './camera.js';

// Explosion class for the explosion animation
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.isFinished = false;
    this.createParticles();
  }

  createParticles() {
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 20 + 10; // Random speed between 10 and 30 pixels per tick
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const lifetime = Math.random() * 40 + 20; // Lifetime between 20 and 60 ticks
      this.particles.push({
        x: this.x,
        y: this.y,
        vx,
        vy,
        lifetime,
        age: 0,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      });
    }
  }

  update(deltaTicks) {
    this.isFinished = true;
    for (const particle of this.particles) {
      particle.age += deltaTicks;
      if (particle.age < particle.lifetime) {
        particle.vx *= 0.98; // Apply friction
        particle.vy += settings.GRAVITY * deltaTicks * 0.5; // Apply gravity
        particle.x += particle.vx * deltaTicks;
        particle.y += particle.vy * deltaTicks;
        this.isFinished = false;
      }
    }
  }

  draw() {
    for (const particle of this.particles) {
      if (particle.age < particle.lifetime) {
        ctx.fillStyle = particle.color;
        const alpha = 1 - particle.age / particle.lifetime;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(particle.x, t(particle.y), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha
      }
    }
  }
}

export { Explosion };