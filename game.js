// game.js

// Constants for physics and game mechanics
const GRAVITY = 0.7;
const PLATFORM_SPACING = 150;
const MIN_HOLE_WIDTH = 50;
const MAX_HOLE_WIDTH = 100;
const PLATFORM_HEIGHT = 20;
const BALL_RADIUS = 10;
const MOVE_SPEED = 10; // Movement speed per tick

// Constants for game animations
const BOUNCING_HEIGHT = 0.7 * PLATFORM_SPACING;

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set initial canvas dimensions
canvas.width = 400; // Original game width
canvas.height = 600; // Original game height

// Use variables for WIDTH and HEIGHT to allow updates
let WIDTH = canvas.width;
let HEIGHT = canvas.height;

// Resize canvas to fit the viewport while maintaining aspect ratio
function resizeCanvas() {
  const aspectRatio = WIDTH / HEIGHT; // 400 / 600 = 0.6667

  // Get the available width and height
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Calculate the maximum canvas size that fits in the window while maintaining aspect ratio
  let newWidth = windowWidth;
  let newHeight = windowWidth / aspectRatio;

  if (newHeight > windowHeight) {
    // Adjust width and height to fit within window height
    newHeight = windowHeight;
    newWidth = windowHeight * aspectRatio;
  }

  // Adjust for device pixel ratio
  const scale = window.devicePixelRatio || 1;

  // Set the canvas's internal dimensions to match the displayed size multiplied by the scale
  canvas.width = newWidth * scale;
  canvas.height = newHeight * scale;

  // Set the canvas's CSS size to the new width and height
  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;

  // Update the drawing context scale
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Update WIDTH and HEIGHT variables
  WIDTH = canvas.width / scale;
  HEIGHT = canvas.height / scale;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Ball class
class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = BALL_RADIUS;
    this.vy = 0;
  }

  update(deltaTicks) {
    this.vy += GRAVITY * deltaTicks;
    this.y += this.vy * deltaTicks;
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
    this.y = PLATFORM_SPACING + index * PLATFORM_SPACING;
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

  update(moveDirection, deltaTicks) {
    const horizontalMovement = moveDirection * MOVE_SPEED * deltaTicks;

    this.holes.forEach((hole) => {
      hole.x += horizontalMovement;

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
  constructor(game) {
    this.game = game;
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
      (platform) => platform.y > -PLATFORM_HEIGHT
    );

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
        ball.y + ball.radius < platform.y + PLATFORM_HEIGHT
    );
  }

  isBallInHole(ball, platform) {
    return platform.holes.some(
      (hole) => ball.x > hole.x && ball.x < hole.x + hole.width
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
    if (this.isBallInHole(ball, collidingPlatform)) {
      this.game.score = collidingPlatform.index + 1;
      return;
    };

    ball.bounce();
  }
}

// Game class
class Game {
  constructor() {
    this.ball = new Ball(WIDTH / 2, 50);
    this.platformManager = new PlatformManager(this);
    this.score = 0;
    this.lastTime = 0; // Initialize lastTime
    this.bindEvents();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  bindEvents() {
    // Keyboard controls
    document.addEventListener("keydown", ({ key }) => {
      if (key === "ArrowLeft") this.platformManager.setMoveDirection(1);
      if (key === "ArrowRight") this.platformManager.setMoveDirection(-1);
    });

    document.addEventListener("keyup", ({ key }) => {
      if (key === "ArrowLeft") this.platformManager.stopMovement(1);
      if (key === "ArrowRight") this.platformManager.stopMovement(-1);
    });

    // Touch controls
    canvas.addEventListener("touchstart", (event) => {
      this.handleTouch(event);
    });

    canvas.addEventListener("touchmove", (event) => {
      this.handleTouch(event);
    });

    canvas.addEventListener("touchend", () => {
      this.platformManager.moveDirection = 0;
    });
  }

  handleTouch(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;

    if (touchX < WIDTH / 2) {
      // Touch on the left half
      this.platformManager.setMoveDirection(1);
    } else {
      // Touch on the right half
      this.platformManager.setMoveDirection(-1);
    }
  }

  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    // Calculate deltaTime in ticks (1 tick = 1/60 second)
    const deltaTime = currentTime - this.lastTime;
    const deltaTicks = deltaTime / (1000 / 60);
    this.lastTime = currentTime;

    this.update(deltaTicks);
    this.draw();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Update states of the game objects
   */
  update(deltaTicks) {
    // Update ball
    this.ball.update(deltaTicks);
    this.platformManager.update(deltaTicks);
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
