// Constants for physics and game mechanics
const GRAVITY = 0.3;
const PLATFORM_SPACING = 150;
const MIN_HOLE_WIDTH = 50;
const MAX_HOLE_WIDTH = 100;
const PLATFORM_HEIGHT = 20;
const BALL_RADIUS = 10;

// Constants for game animations
const BOUNCING_HEIGHT = 0.7 * PLATFORM_SPACING;
const PLATFORM_SPEED = 5;

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Ball class
class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = BALL_RADIUS;
    this.vy = 0;
  }

  update() {
    this.vy += GRAVITY;
    this.y += this.vy;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Handle ball bounce
   */
  bounce() {
    this.vy = -Math.sqrt(2 * GRAVITY * BOUNCING_HEIGHT);
  }
}

// Platform class
class Platform {
  constructor(index) {
    this.index = index;
    this.y = HEIGHT - index * PLATFORM_SPACING - PLATFORM_SPACING;
    this.holes = this.generateHoles();
  }

  generateHoles() {
    const holeCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 holes
    const holes = [];
    let attempts = 0;

    while (holes.length < holeCount && attempts < 100) {
      const holeWidth =
        Math.random() * (MAX_HOLE_WIDTH - MIN_HOLE_WIDTH) + MIN_HOLE_WIDTH;
      const holeX = Math.random() * (WIDTH - holeWidth);
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

  update(moveDirection) {
    this.holes.forEach((hole) => {
      hole.x += moveDirection * PLATFORM_SPEED;

      // Wrap around logic
      if (hole.x < -hole.width) hole.x += WIDTH + hole.width;
      if (hole.x > WIDTH) hole.x -= WIDTH + hole.width;
    });
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, this.y, WIDTH, PLATFORM_HEIGHT);
    this.holes.forEach((hole) => {
      ctx.clearRect(hole.x, this.y, hole.width, PLATFORM_HEIGHT);
    });
  }
}

// PlatformManager class
class PlatformManager {
  constructor() {
    this.platforms = [];
    this.moveDirection = 0;

    // Generate initial platforms
    for (let i = 0; i < 6; i++) {
      this.createPlatform(i);
    }
  }

  createPlatform(index) {
    const platform = new Platform(index);
    this.platforms.push(platform);
  }

  update(scrollSpeed) {
    // Remove platforms that are off the screen
    this.platforms = this.platforms.filter(
      (platform) => platform.y > -PLATFORM_HEIGHT
    );

    // Update platforms
    this.platforms.forEach((platform) =>
      platform.update(this.moveDirection, scrollSpeed)
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
        ball.y + ball.radius < platform.y + PLATFORM_HEIGHT
    );
  }

  isBallInHole(ball, platform) {
    return platform.holes.some(
      (hole) =>
        ball.x > hole.x &&
        ball.x < hole.x + hole.width
    );
  }

  /**
   * Bounce the ball on collision with a platform
   * @param {*} ball
   */
  handleCollisions(ball) {
    const collidingPlatform = this.getCollidingPlatform(ball);
    if (!collidingPlatform) return; // Return if no collision
    // Let the ball fall through the hole
    if (this.isBallInHole(ball, collidingPlatform)) return;
    
    ball.bounce();
  }
}

// Game class
class Game {
  constructor() {
    this.ball = new Ball(WIDTH / 2, 50);
    this.platformManager = new PlatformManager();
    this.score = 0;
    this.bindEvents();
    this.gameLoop();
  }

  bindEvents() {
    document.addEventListener("keydown", ({ key }) => {
      if (key === "ArrowLeft") this.platformManager.moveDirection = 1;
      if (key === "ArrowRight") this.platformManager.moveDirection = -1;
    });

    document.addEventListener("keyup", ({ key }) => {
      if (key === "ArrowLeft" && this.platformManager.moveDirection === 1)
        this.platformManager.moveDirection = 0;
      if (key === "ArrowRight" && this.platformManager.moveDirection === -1)
        this.platformManager.moveDirection = 0;
    });
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update states of the game objects
   */
  update() {
    // Update ball
    this.ball.update();
    this.platformManager.update();
    this.platformManager.handleCollisions(this.ball);
  }

  draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.platformManager.draw();
    this.ball.draw();
    this.drawScore();
  }

  drawScore() {
    ctx.fillStyle = "yellow";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${this.score}`, 10, 30);
  }
}

// Start the game
new Game();
