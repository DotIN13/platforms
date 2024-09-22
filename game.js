// game.js

import i18next from "./i18n/i18n.js";

// Import the Settings class
import { settings, canvas, ctx } from "./settings.js";
import { camera } from "./camera.js";
import { Ball } from "./ball.js";
import { Explosion } from "./explosion.js";
import { PlatformManager } from "./platform.js";

// Game class with optimizations
class Game {
  constructor() {
    this.ball = new Ball(settings.WIDTH / 2, 50);
    this.platformManager = new PlatformManager();
    this.maxLevel = 0;
    this.score = 0;
    this.lastTime = 0; // Initialize lastTime
    this.gameOver = false; // Game over flag
    this.animationFrameId = null; // Keep track of animation frame
    this.explosion = null; // Explosion animation
    this.explosionEnd = false; // Flag to check if explosion is finished

    // Combo system properties
    this.comboActive = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastLevelUpTime = null; // Timestamp of the last level up
    this.comboMultiplier = 1; // Score multiplier during combo

    // Bind event handler methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.bindEvents();
    this.startGameLoop();
  }

  bindEvents() {
    // Keyboard controls
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);

    // Touch controls
    canvas.addEventListener("touchstart", this.handleTouchStart);
    canvas.addEventListener("touchmove", this.handleTouchMove);
    canvas.addEventListener("touchend", this.handleTouchEnd);

    // Click to restart
    canvas.addEventListener("click", this.handleClick);
  }

  unbindEvents() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    canvas.removeEventListener("touchstart", this.handleTouchStart);
    canvas.removeEventListener("touchmove", this.handleTouchMove);
    canvas.removeEventListener("touchend", this.handleTouchEnd);
    canvas.removeEventListener("click", this.handleClick);
  }

  handleKeyDown(event) {
    if (this.gameOver && this.explosionEnd) return this.resetGame(); // Restart the game if it's over

    if (event.key === "ArrowLeft") this.platformManager.setMoveDirection(1);
    if (event.key === "ArrowRight") this.platformManager.setMoveDirection(-1);
  }

  handleKeyUp(event) {
    if (this.gameOver) return; // Disable controls if game is over

    if (event.key === "ArrowLeft") this.platformManager.stopMovement(1);
    if (event.key === "ArrowRight") this.platformManager.stopMovement(-1);
  }

  handleTouchStart(event) {
    if (this.gameOver && this.explosionEnd) return this.resetGame();

    this.handleTouch(event);
  }

  handleTouchMove(event) {
    if (this.gameOver) return;

    this.handleTouch(event);
  }

  handleTouchEnd(event) {
    if (this.gameOver) return;

    this.platformManager.moveDirection = 0;
  }

  handleClick(event) {
    if (this.gameOver && this.explosionEnd) this.resetGame();
  }

  handleTouch(event) {
    if (this.gameOver) return; // Disable controls if game is over

    event.preventDefault();
    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;

    if (touchX < (settings.WIDTH * settings.SCALE_FACTOR) / 2) {
      // Touch on the left half
      this.platformManager.setMoveDirection(1);
    } else {
      // Touch on the right half
      this.platformManager.setMoveDirection(-1);
    }
  }

  startGameLoop() {
    if (this.animationFrameId) return; // Prevent multiple loops
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  stopGameLoop() {
    if (!this.animationFrameId) return;

    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  resetGame() {
    // Reset game state
    this.stopGameLoop();
    this.unbindEvents();

    this.ball = null;
    this.platformManager = null;

    this.ball = new Ball(settings.WIDTH / 2, 50);
    this.platformManager = new PlatformManager();
    this.explosion = null;
    this.explosionEnd = false;

    this.maxLevel = 0;
    this.score = 0;
    this.gameOver = false;
    this.lastTime = 0;
    camera.reset();

    // Reset combo properties
    this.comboActive = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastLevelUpTime = null;
    this.comboMultiplier = 1;

    this.bindEvents();
    this.startGameLoop();
  }

  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const deltaTicks = ((currentTime - this.lastTime) / 1000) * 60; // Convert to seconds
    this.lastTime = currentTime;

    this.update(deltaTicks);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Update states of the game objects
   */
  update(deltaTicks) {
    // Update explosion if game is over
    if (this.gameOver) {
      if (this.explosionEnd) return;

      return this.explosion.update(deltaTicks);
    }

    // Update ball
    this.ball.update(deltaTicks);
    this.platformManager.update(deltaTicks);
    this.platformManager.handleCollisions(this.ball);

    // Check if the ball hit a spike
    if (this.ball.hitSpike && !this.ball.isExploding) {
      this.triggerExplosion();
      return;
    }

    // Update combo timer
    if (this.comboActive) {
      this.comboTimer -= deltaTicks;
      if (this.comboTimer <= 0) this.endCombo();
    }

    // Update score and combo
    if (this.ball.level > this.maxLevel) {
      this.maxLevel = this.ball.level;
      this.handleLevelUp();
    }

    // Update camera
    camera.update(this.maxLevel);
  }

  handleLevelUp() {
    const currentTime = performance.now() / 1000; // Current time in seconds

    if (this.lastLevelUpTime) {
      const ticksSinceLastLevelUp = (currentTime - this.lastLevelUpTime) * 60;

      if (ticksSinceLastLevelUp <= settings.COMBO_DURATION) {
        this.comboActive = true;
        this.comboCount += 1;
        this.comboMultiplier += 0.5; // Increase multiplier
        this.comboTimer = settings.COMBO_DURATION;
      } else {
        // Not within combo time frame
        this.endCombo();
      }
    }

    // Update last level up time
    this.lastLevelUpTime = currentTime;

    // Increase score
    this.score += 2 * this.comboMultiplier;
  }

  endCombo() {
    this.comboActive = false;
    this.comboCount = 0;
    this.comboMultiplier = 1;
  }

  triggerExplosion() {
    this.ball.isExploding = true;
    this.explosion = new Explosion(this.ball.x, this.ball.y);
    this.gameOver = true;
  }

  draw() {
    ctx.clearRect(0, 0, settings.WIDTH, settings.HEIGHT);
    this.platformManager.draw();
    this.ball.draw();
    if (this.explosion) this.explosionEnd = this.explosion.draw();
    this.drawScore();
    if (this.comboActive) this.drawCombo();

    // Draw game over screen
    if (this.gameOver && this.explosionEnd) {
      this.stopGameLoop();
      this.drawGameOver();
    }
  }

  drawScore() {
    // Add a background to the score text
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, 100, 40);

    // Draw the score text
    ctx.fillStyle = "yellow";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(i18next.t("game.score", { score: this.score }), 10, 30);
  }

  drawCombo() {
    ctx.fillStyle = "cyan";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      i18next.t("game.combo", { comboCount: this.comboCount }),
      settings.WIDTH / 2,
      80
    );
  }

  drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, settings.WIDTH, settings.HEIGHT);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      i18next.t("game.gameOver"),
      settings.WIDTH / 2,
      settings.HEIGHT / 2 - 40
    );

    ctx.font = "20px Arial";
    ctx.fillText(
      i18next.t("game.finalScore", { score: this.score }),
      settings.WIDTH / 2,
      settings.HEIGHT / 2
    );

    ctx.font = "20px Arial";
    ctx.fillText(
      i18next.t("game.clickToRestart"),
      settings.WIDTH / 2,
      settings.HEIGHT / 2 + 40
    );
  }
}

// Start the game
i18next.on("initialized", () => {
  const game = new Game();
});
