import { settings, ctx } from "./settings.js";
import { camera, t } from "./camera.js";

// Platform class with object pooling
class Platform {
  constructor(index) {
    this.reset(index);
  }

  reset(index) {
    this.index = index;
    this.y = index * settings.PLATFORM_SPACING;
    this.holes = this.generateHoles();
    this.spikes = this.generateSpikes();
  }

  generateHoles() {
    const holeCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 holes
    const holes = [];
    let attempts = 0;

    while (holes.length < holeCount && attempts < 100) {
      const holeWidth =
        Math.random() * (settings.MAX_HOLE_WIDTH - settings.MIN_HOLE_WIDTH) +
        settings.MIN_HOLE_WIDTH;
      const holeX = Math.random() * (settings.WIDTH - holeWidth);
      const newHole = { x: holeX, width: holeWidth };

      // Check for overlap
      const overlap = holes.some(
        (hole) => holeX < hole.x + hole.width && holeX + holeWidth > hole.x
      );

      if (!overlap) {
        holes.push(newHole);
      }

      attempts++;
    }

    return holes;
  }

  spikeCount() {
    // Max spike count is adjusted based on the platform index
    if (this.index < 3) return 0;
    if (this.index < 10) return Math.floor(Math.random() * 3);
    if (this.index < 20) return Math.floor(Math.random() * 4);
    if (this.index < 30) return Math.floor(Math.random() * 5);
    return Math.floor(Math.random() * 6);
  }

  generateSpikes() {
    const spikeCount = this.spikeCount();
    const spikes = [];
    let attempts = 0;

    while (spikes.length < spikeCount && attempts < 100) {
      const spikeWidth = 20; // Fixed width for spikes
      const spikeX = Math.random() * (settings.WIDTH - spikeWidth);
      const newSpike = { x: spikeX, width: spikeWidth };

      // Check for overlap with other spikes and holes
      const overlapWithSpikes = spikes.some(
        (spike) =>
          spikeX < spike.x + spike.width && spikeX + spikeWidth > spike.x
      );

      const overlapWithHoles = this.holes.some(
        (hole) => spikeX < hole.x + hole.width && spikeX + spikeWidth > hole.x
      );

      if (!overlapWithSpikes && !overlapWithHoles) {
        spikes.push(newSpike);
      }

      attempts++;
    }

    return spikes;
  }

  update(moveDirection, deltaTicks) {
    const horizontalMovement = moveDirection * settings.MOVE_SPEED * deltaTicks;

    for (const hole of this.holes) {
      hole.x += horizontalMovement;

      // Wrap around logic for holes
      if (hole.x < -hole.width) hole.x += settings.WIDTH + hole.width;
      if (hole.x > settings.WIDTH) hole.x -= settings.WIDTH + hole.width;
    }

    for (const spike of this.spikes) {
      spike.x += horizontalMovement;

      // Wrap around logic for spikes
      if (spike.x < -spike.width) spike.x += settings.WIDTH + spike.width;
      if (spike.x > settings.WIDTH) spike.x -= settings.WIDTH + spike.width;
    }
  }

  draw() {
    const y = t(this.y);
    const width = settings.WIDTH;
    const platformHeight = settings.PLATFORM_HEIGHT;

    ctx.fillStyle = "white";
    ctx.fillRect(0, y, width, platformHeight);

    // Clear holes
    for (const hole of this.holes) {
      ctx.clearRect(hole.x, y - 1, hole.width, platformHeight + 2);
    }

    // Draw spikes
    if (this.spikes.length > 0) {
      ctx.fillStyle = "orange";
      const spikeHeight = platformHeight * 1.5;
      for (const spike of this.spikes) {
        ctx.beginPath();
        ctx.moveTo(spike.x, y);
        ctx.lineTo(spike.x + spike.width / 2, y - spikeHeight);
        ctx.lineTo(spike.x + spike.width, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

// PlatformManager class with object pooling and optimized collision detection
class PlatformManager {
  constructor() {
    this.platforms = [];
    this.platformPool = [];
    this.moveDirection = 0;
    this.lastDrawn = 0;

    // Generate initial platforms
    const numPlatforms =
      Math.ceil(settings.HEIGHT / settings.PLATFORM_SPACING) + 1;
    for (let i = 0; i < numPlatforms; i++) {
      this.createPlatform(i);
    }
  }

  createPlatform(index) {
    let platform;
    if (this.platformPool.length > 0) {
      platform = this.platformPool.pop();
      platform.reset(index);
    } else {
      platform = new Platform(index);
    }
    this.platforms.push(platform);
    this.lastDrawn = index;
  }

  setMoveDirection(direction) {
    this.moveDirection = direction;
  }

  stopMovement(direction) {
    if (this.moveDirection === direction) {
      this.moveDirection = 0;
    }
  }

  update(deltaTicks) {
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const platform = this.platforms[i];
      if (t(platform.y) < 0) {
        // Move platform to pool
        this.platforms.splice(i, 1);
        this.platformPool.push(platform);
      } else {
        platform.update(this.moveDirection, deltaTicks);
      }
    }

    // Generate new platforms as needed
    while (
      (this.lastDrawn + 1) * settings.PLATFORM_SPACING <
      camera.y + settings.HEIGHT
    ) {
      this.createPlatform(++this.lastDrawn);
    }
  }

  draw() {
    for (const platform of this.platforms) {
      platform.draw();
    }
  }

  getCollidingPlatform(ball) {
    const expectedPlatformIndex = Math.floor(
      (ball.y + ball.radius) / settings.PLATFORM_SPACING
    );
    const platform = this.platforms.find(
      (platform) => platform.index === expectedPlatformIndex
    );
    if (
      platform &&
      ball.vy > 0 &&
      ball.y + ball.radius > platform.y &&
      ball.y + ball.radius < platform.y + settings.PLATFORM_HEIGHT
    ) {
      return platform;
    }
    return null;
  }

  isBallInHole(ball, platform) {
    return platform.holes.some(
      (hole) => ball.x > hole.x && ball.x < hole.x + hole.width
    );
  }

  isBallOnSpike(ball, platform) {
    return platform.spikes.some(
      (spike) =>
        ball.x + ball.radius > spike.x &&
        ball.x - ball.radius < spike.x + spike.width &&
        ball.y + ball.radius >= platform.y // Ensure ball is touching the platform
    );
  }

  /**
   * Handle collisions with platforms, holes, and spikes
   * @param {*} ball
   */
  handleCollisions(ball) {
    const collidingPlatform = this.getCollidingPlatform(ball);
    if (!collidingPlatform) return; // Return if no collision

    // Return if ball is below the platform
    if (ball.level >= collidingPlatform.index) return;

    // Check for collision with spikes
    if (this.isBallOnSpike(ball, collidingPlatform)) {
      ball.hitSpike = true; // Set a flag to indicate the ball hit a spike
      return;
    }

    // Let the ball fall through the hole
    if (this.isBallInHole(ball, collidingPlatform)) {
      ball.level = collidingPlatform.index;
      return;
    }

    // Bounce off the platform
    ball.bounce();
  }
}

export { PlatformManager };