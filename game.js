// game.js

// Import the Settings class
import { settings, canvas, ctx } from "./settings.js";
import { camera, t } from "./camera.js";

// Ball class remains unchanged
class Ball {
  constructor(x, y) {
    this.level = 0;
    this.x = x;
    this.y = y;
    this.radius = settings.BALL_RADIUS;
    this.vy = 0;
  }

  update(deltaTicks) {
    this.vy += settings.GRAVITY * deltaTicks;
    this.y += this.vy * deltaTicks;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, t(this.y), this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Handle ball bounce
   */
  bounce() {
    this.vy = -Math.sqrt(2 * settings.GRAVITY * settings.BOUNCING_HEIGHT);
  }
}

// Platform class with spikes
class Platform {
  constructor(index) {
    this.index = index;
    this.y = index * settings.PLATFORM_SPACING;
    this.holes = this.generateHoles();
    this.spikes = this.generateSpikes(); // New property for spikes
  }

  generateHoles() {
    // Existing code for generating holes
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
    // New method for generating spikes
    const spikeCount = this.spikeCount();
    const spikes = [];
    let attempts = 0;

    while (spikes.length < spikeCount && attempts < 100) {
      const spikeWidth = 20; // Fixed width for spikes
      const spikeX = Math.random() * (settings.WIDTH - spikeWidth);
      const newSpike = { x: spikeX, width: spikeWidth };

      // Check for overlap with other spikes and holes
      const overlapWithSpikes = spikes.some(
        (spike) => spikeX < spike.x + spike.width && spikeX + spikeWidth > spike.x
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

    this.holes.forEach((hole) => {
      hole.x += horizontalMovement;

      // Wrap around logic for holes
      if (hole.x < -hole.width) hole.x += settings.WIDTH + hole.width;
      if (hole.x > settings.WIDTH) hole.x -= settings.WIDTH + hole.width;
    });

    this.spikes.forEach((spike) => {
      spike.x += horizontalMovement;

      // Wrap around logic for spikes
      if (spike.x < -spike.width) spike.x += settings.WIDTH + spike.width;
      if (spike.x > settings.WIDTH) spike.x -= settings.WIDTH + spike.width;
    });
  }

  draw() {
    const y = t(this.y);
    ctx.fillStyle = "white";
    ctx.fillRect(0, y, settings.WIDTH, settings.PLATFORM_HEIGHT);

    // Clear holes
    this.holes.forEach((hole) => {
      ctx.clearRect(hole.x, y - 1, hole.width, settings.PLATFORM_HEIGHT + 2);
    });

    // Draw spikes
    this.spikes.forEach((spike) => {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      const spikeHeight = settings.PLATFORM_HEIGHT * 1.5;
      ctx.moveTo(spike.x, y);
      ctx.lineTo(spike.x + spike.width / 2, y - spikeHeight);
      ctx.lineTo(spike.x + spike.width, y);
      ctx.closePath();
      ctx.fill();
    });
  }
}

// PlatformManager class with spike collision detection
class PlatformManager {
  constructor() {
    this.platforms = [];
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
    const platform = new Platform(index);
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
    // Remove platforms that are off the screen
    this.platforms = this.platforms.filter(
      (platform) => t(platform.y) >= 0
    );

    const targetNum = Math.ceil(
      (camera.y + settings.HEIGHT) / settings.PLATFORM_SPACING
    );
    for (let i = this.lastDrawn + 1; i < targetNum; i++) {
      this.createPlatform(i);
    }

    // Update platforms
    this.platforms.forEach((platform) =>
      platform.update(this.moveDirection, deltaTicks)
    );
  }

  draw() {
    this.platforms.forEach((platform) => platform.draw());
  }

  getCollidingPlatform(ball) {
    return this.platforms.find(
      (platform) =>
        ball.vy > 0 && // Ball is moving downward
        ball.y + ball.radius > platform.y &&
        ball.y + ball.radius < platform.y + settings.PLATFORM_HEIGHT
    );
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

// Game class with restart functionality
class Game {
  constructor() {
    this.ball = new Ball(settings.WIDTH / 2, 50);
    this.platformManager = new PlatformManager();
    this.maxLevel = 0;
    this.score = 0;
    this.lastTime = 0; // Initialize lastTime
    this.gameOver = false; // Game over flag
    this.bindEvents();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  bindEvents() {
    // Keyboard controls
    document.addEventListener("keydown", ({ key }) => {
      if (this.gameOver) return; // Disable controls if game is over
      if (key === "ArrowLeft") this.platformManager.setMoveDirection(1);
      if (key === "ArrowRight") this.platformManager.setMoveDirection(-1);
    });

    document.addEventListener("keyup", ({ key }) => {
      if (this.gameOver) return; // Disable controls if game is over
      if (key === "ArrowLeft") this.platformManager.stopMovement(1);
      if (key === "ArrowRight") this.platformManager.stopMovement(-1);
    });

    // Touch controls
    canvas.addEventListener("touchstart", (event) => {
      if (this.gameOver) {
        this.resetGame();
      } else {
        this.handleTouch(event);
      }
    });

    canvas.addEventListener("touchmove", (event) => {
      if (!this.gameOver) {
        this.handleTouch(event);
      }
    });

    canvas.addEventListener("touchend", () => {
      if (!this.gameOver) {
        this.platformManager.moveDirection = 0;
      }
    });

    // Click to restart
    canvas.addEventListener("click", () => {
      if (this.gameOver) {
        this.resetGame();
      }
    });
  }

  handleTouch(event) {
    if (this.gameOver) return; // Disable controls if game is over
    event.preventDefault();
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;

    if (touchX < settings.WIDTH / 2) {
      // Touch on the left half
      this.platformManager.setMoveDirection(1);
    } else {
      // Touch on the right half
      this.platformManager.setMoveDirection(-1);
    }
  }

  resetGame() {
    // Reset game state
    this.ball = new Ball(settings.WIDTH / 2, 50);
    this.platformManager = new PlatformManager();
    this.maxLevel = 0;
    this.score = 0;
    this.gameOver = false;
    this.lastTime = 0;
    camera.y = 0;
    camera.targetY = 0;
    // Restart the game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    // Calculate deltaTime in ticks (1 tick = 1/60 second)
    const deltaTime = currentTime - this.lastTime;
    const deltaTicks = deltaTime / (1000 / 60);
    this.lastTime = currentTime;

    this.update(deltaTicks);
    this.draw();

    if (!this.gameOver) {
      requestAnimationFrame(this.gameLoop.bind(this));
    } else {
      this.drawGameOver();
    }
  }

  /**
   * Update states of the game objects
   */
  update(deltaTicks) {
    if (this.gameOver) return;

    // Update ball
    this.ball.update(deltaTicks);
    this.platformManager.update(deltaTicks);
    this.platformManager.handleCollisions(this.ball);

    // Check if the ball hit a spike
    if (this.ball.hitSpike) {
      this.gameOver = true;
      return;
    }

    // Update score
    if (this.ball.level > this.maxLevel) {
      this.maxLevel = this.ball.level;
      this.score += 1;
    }

    // Update camera
    camera.targetY = Math.max(
      camera.targetY,
      this.maxLevel * settings.PLATFORM_SPACING
    );
    camera.update();
  }

  draw() {
    ctx.clearRect(0, 0, settings.WIDTH, settings.HEIGHT);
    this.platformManager.draw();
    this.ball.draw();
    this.drawScore();
  }

  drawScore() {
    ctx.fillStyle = "yellow";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${this.score}`, 10, 30);
  }

  drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, settings.WIDTH, settings.HEIGHT);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", settings.WIDTH / 2, settings.HEIGHT / 2 - 40);

    ctx.font = "20px Arial";
    ctx.fillText(
      `Final Score: ${this.score}`,
      settings.WIDTH / 2,
      settings.HEIGHT / 2
    );

    ctx.font = "20px Arial";
    ctx.fillText(
      `Click or Tap to Restart`,
      settings.WIDTH / 2,
      settings.HEIGHT / 2 + 40
    );
  }
}

// Start the game
const game = new Game();