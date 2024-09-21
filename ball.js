import { settings, ctx } from "./settings.js";
import { t } from "./camera.js";

// Ball class with explosion animation
class Ball {
  constructor(x, y) {
    this.level = 0;
    this.x = x;
    this.y = y;
    this.radius = settings.BALL_RADIUS;
    this.vy = 0;
    this.hitSpike = false;

    // Explosion animation properties
    this.isExploding = false;
  }

  update(deltaTicks) {
    if (this.isExploding) return;

    this.vy += settings.GRAVITY * deltaTicks;
    this.vy = Math.min(this.vy, settings.MAX_BALL_SPEED);
    this.y += this.vy * deltaTicks;
  }

  draw() {
    if (this.isExploding) return;

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, t(this.y), this.radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  bounce() {
    this.vy = -Math.sqrt(2 * settings.GRAVITY * settings.BOUNCING_HEIGHT);
  }
}

export { Ball };